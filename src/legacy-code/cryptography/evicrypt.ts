/* eslint-disable no-bitwise */
import { fromUint8Array, toUint8Array } from 'js-base64'
import { ErrorMessage, ExtensionError } from '$/error'
import {
  random,
  sha256,
  uint8ArrayToWordArray,
  wordArrayToUint8Array,
} from '../utils'
import { AesUtil, shiftLeft, shiftRight } from './aes-util'
import {
  addJammingSimple,
  addJammingSimpleText,
  removeJammingSimple,
  removeJammingSimpleText,
} from './jamming'

const idMessage = new Uint8Array([0, 0, 0, 21])

const idFile = new Uint8Array([0, 0, 0, 22])
const blockSize = 262_144

interface Keys {
  high: Uint8Array
  low: Uint8Array
}

export class EviCrypt {
  keys: Keys

  constructor(keys: Keys) {
    this.keys = keys
  }

  async encryptText(plainText: string): Promise<string> {
    const iv = random(16)
    const salt = random(32)
    const aes = new AesUtil(256, 1000)
    const enc = aes.encryptCTR(
      iv,
      salt,
      this.keys.high,
      new TextEncoder().encode(plainText)
    )

    const jam = addJammingSimpleText(
      new Uint8Array([...iv, ...salt]),
      this.keys.low.slice(20),
      plainText.length
    )

    const idKeyFull = await sha256(
      new Uint8Array([...this.keys.low.slice(0, 20), ...jam.slice(0, 32)])
    )
    const keyID = idKeyFull.slice(0, 20)

    const cA = new Uint8Array([...idMessage, ...keyID, ...jam, ...enc])

    return fromUint8Array(cA, true)
  }

  decryptText(cipherText: string): string {
    const dataText = toUint8Array(cipherText)

    let offset = 24

    const dataToDecipher = removeJammingSimpleText(
      dataText.slice(offset),
      this.keys.low.slice(20),
      48
    )
    offset += dataToDecipher.size

    const iv = dataToDecipher.data.slice(0, 16)
    const salt = dataToDecipher.data.slice(16, 48)

    const aes = new AesUtil(256, 1000)
    const dec = aes.decryptCTR(iv, salt, this.keys.high, dataText.slice(offset))

    return new TextDecoder().decode(dec)
  }

  async encryptFile(
    file: File,
    progressReporter: (progress: number) => void
  ): Promise<BlobPart[]> {
    if (file.name.length > 256)
      throw new ExtensionError(ErrorMessage.FileNameTooLong)

    progressReporter(0)

    const uintFileName = new TextEncoder().encode(file.name)

    const iv = random(16)
    const salt = random(32)
    const shift = random(1)
    const jam = shiftLeft(new Uint8Array([...iv, ...salt]), shift[0])

    const idKeyFull = await sha256(
      new Uint8Array([...this.keys.low.slice(0, 20), ...jam.slice(0, 32)])
    )
    const idKey = idKeyFull.slice(0, 20)

    const aes = new AesUtil(256, 1000)
    let iv2 = random(16)
    const salt2 = random(32)
    const data = new Uint8Array([
      ...iv2,
      ...salt2,
      ...aes.encryptCTR(iv, salt, this.keys.high, uintFileName),
    ])

    const blobParts: BlobPart[] = [
      idFile,
      new Uint8Array([shift[0] ^ this.keys.low[24]]),
      idKey,
      jam,
      addJammingSimple(data, this.keys.low.slice(20)),
    ]

    const buffer = await readAsArrayBuffer(file)

    // Encrypt each block separetely
    let j = 0
    while (j * blockSize < buffer.length) {
      const block = aes.encryptCTR(
        iv2,
        salt2,
        this.keys.high,
        buffer.slice(j * blockSize, (j + 1) * blockSize)
      )
      blobParts.push(block)

      progressReporter((j * blockSize) / buffer.length)

      // We need to wait for the current task to finish and the event loop to
      // start a new iteration for the report to be sent. We use `setTimeout`
      // instead of `queueMicrotask` because:
      // "Microtasks are another solution to this problem, providing a finer
      // degree of access by **making it possible to schedule code to run before
      // the next iteration** of the event loop begins, instead of having to
      // wait until the next one."
      // (https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide/In_depth#solutions)
      await new Promise<void>((resolve) => {
        setTimeout(resolve)
      })

      j++
      iv2 = incrementWordArray(iv2, blockSize / 16)
    }

    progressReporter(1)

    return blobParts
  }

  async decryptFileBuffer(
    buffer: Uint8Array,
    progressReporter: (progress: number) => void
  ): Promise<File> {
    if (
      buffer.length < 122 || // 4 + 20 + 16 + 32 + 16 + 32 + 2
      !buffer.slice(0, 4).every((n, i) => n === idFile[i])
    )
      throw new ExtensionError(ErrorMessage.FileNotRecognized)

    progressReporter(0)

    const saltId = buffer.slice(25, 57)
    const idKeyFull = await sha256(
      new Uint8Array([...this.keys.low.slice(0, 20), ...saltId])
    )
    const idKey = idKeyFull.slice(0, 20)

    if (!buffer.slice(5, 25).every((n, i) => n === idKey[i]))
      throw new ExtensionError(ErrorMessage.WrongKey)

    const jam = shiftRight(buffer.slice(25, 73), buffer[4] ^ this.keys.low[24])

    const iv = jam.slice(0, 16)
    const salt = jam.slice(16, 48)

    let offset = 73
    const dataToDecipher = removeJammingSimple(
      buffer.slice(offset, offset + 1 + 515),
      this.keys.low.slice(20)
    )

    offset += dataToDecipher.size

    const aes = new AesUtil(256, 1000)
    const fileName = new TextDecoder().decode(
      aes.decryptCTR(iv, salt, this.keys.high, dataToDecipher.data.slice(48))
    )

    let iv2 = dataToDecipher.data.slice(0, 16)
    const salt2 = dataToDecipher.data.slice(16, 48)

    const blobParts: BlobPart[] = []

    // Decrypt each block separetely
    let j = 0
    while (j * blockSize < buffer.length) {
      const block = aes.decryptCTR(
        iv2,
        salt2,
        this.keys.high,
        buffer.slice(offset + j * blockSize, offset + (j + 1) * blockSize)
      )
      blobParts.push(block)

      progressReporter((j * blockSize) / buffer.length)

      // This trick is explained above
      await new Promise<void>((resolve) => {
        setTimeout(resolve)
      })

      j++
      iv2 = incrementWordArray(iv2, blockSize / 16)
    }

    progressReporter(1)

    return new File(blobParts, fileName)
  }
}

/** @returns The public identifier of the key used to encrypt `str` */
export const keyUsed = (str: string): Uint8Array =>
  toUint8Array(str).slice(4, 56)

const readAsArrayBuffer = async (file: File) =>
  new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      resolve(new Uint8Array(reader.result as ArrayBuffer))
    })
    reader.addEventListener('error', () => {
      reject(reader.error)
    })
    reader.readAsArrayBuffer(file)
  })

function incrementWordArray(arr: Uint8Array, increment: number) {
  const wordArray = uint8ArrayToWordArray(arr)
  wordArray.words[3] = Math.trunc(wordArray.words[3] + increment)
  return wordArrayToUint8Array(wordArray)
}
