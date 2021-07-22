/* eslint-disable unicorn/filename-case */
import { fromUint8Array, toUint8Array } from 'js-base64'
import { Reporter, State } from 'report'
import {
  addJammingSimple,
  addJammingSimpleText,
  AesUtil,
  removeJammingSimpleText,
  shiftLeft,
} from './AesUtil'
import {
  concatUint8Array,
  random,
  sha256,
  uint8ArrayToUTF8,
  uint8ArrayToWordArray,
  utf8ToUint8Array,
  wordArrayToUint8Array,
} from './utils'

const ID_MESSAGE = new Uint8Array([0, 0, 0, 21])

const ID_FILE = new Uint8Array([0, 0, 0, 22])
const blockSize = 262_144
const extension = 'Evi'
const extensionName = '.' + extension

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
    const AES = new AesUtil(256, 1000)
    const enc = AES.encryptCTR(
      iv,
      salt,
      this.keys.high,
      utf8ToUint8Array(plainText)
    )

    const jam = addJammingSimpleText(
      concatUint8Array(iv, salt),
      this.keys.low.slice(20),
      plainText.length
    )

    const keyID = (
      await sha256(
        concatUint8Array(this.keys.low.slice(0, 20), jam.slice(0, 32))
      )
    ).slice(0, 20)

    const cA = new Uint8Array([...ID_MESSAGE, ...keyID, ...jam, ...enc])

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

    const AES = new AesUtil(256, 1000)
    const dec = AES.decryptCTR(iv, salt, this.keys.high, dataText.slice(offset))

    return uint8ArrayToUTF8(dec)
  }

  async encryptFile(file: File, reporter: Reporter): Promise<File> {
    if (file.name.endsWith(extensionName)) return file

    if (file.name.length > 256) throw new Error('Filename too long')

    // Create a random name for the file, the real name is stored
    // encrypted at the beginning of the file
    const name =
      [...crypto.getRandomValues(new Uint8Array(8))]
        .map((n) => String.fromCharCode(97 + (n % 26)))
        .join('') + extensionName

    const uintFileName = new TextEncoder().encode(file.name)

    const reader = new FileReader()

    const iv = random(16)
    const salt = random(32)
    const shift = random(1)
    const jam = shiftLeft(concatUint8Array(iv, salt), shift[0])

    const idKey = (
      await sha256(
        concatUint8Array(this.keys.low.slice(0, 20), jam.slice(0, 32))
      )
    ).slice(0, 20)

    const AES = new AesUtil(256, 1000)
    let iv2 = random(16)
    const salt2 = random(32)
    const temp0 = AES.encryptCTR(iv, salt, this.keys.high, uintFileName)
    const temp1 = concatUint8Array(salt2, temp0)
    const data = concatUint8Array(iv2, temp1)

    const blobParts: BlobPart[] = [
      ID_FILE,
      new Uint8Array([shift[0] ^ this.keys.low[24]]),
      idKey,
      jam,
      addJammingSimple(data, this.keys.low.slice(20)),
    ]

    const buffer = await new Promise<Uint8Array>((resolve, reject) => {
      reader.addEventListener('load', () => {
        resolve(new Uint8Array(reader.result as ArrayBuffer))
      })
      reader.addEventListener('error', () => {
        reject(reader.error)
      })
      reader.readAsArrayBuffer(file)
    })

    reporter({ state: State.TASK_IN_PROGRESS, progress: 0 })

    // Encrypt each block separetely
    let j = 0
    while (j * blockSize < buffer.length) {
      const block = AES.encryptCTR(
        iv2,
        salt2,
        this.keys.high,
        buffer.slice(j * blockSize, (j + 1) * blockSize)
      )
      blobParts.push(block)

      reporter({
        state: State.TASK_IN_PROGRESS,
        progress: (j * blockSize) / buffer.length,
      })

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

    const blob = new Blob(blobParts, {
      type: 'application/octet-stream; charset=utf-8',
    })

    reporter({ state: State.TASK_IN_PROGRESS, progress: 1 })

    return new File([blob], name)
  }
}

/** @returns The public identifier of the key used to encrypt `str` */
export const keyUsed = (str: string): Uint8Array =>
  toUint8Array(str).slice(4, 56)

function incrementWordArray(arr: Uint8Array, increment: number) {
  const wordArray = uint8ArrayToWordArray(arr)
  wordArray.words[3] = Math.trunc(wordArray.words[3] + increment)
  return wordArrayToUint8Array(wordArray)
}
