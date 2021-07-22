/* eslint-disable unicorn/filename-case */
import { fromUint8Array, toUint8Array } from 'js-base64'
import {
  addJammingSimpleText,
  AesUtil,
  removeJammingSimpleText,
} from './AesUtil'
import {
  concatUint8Array,
  random,
  sha256,
  uint8ArrayToUTF8,
  utf8ToUint8Array,
} from './utils'

const ID_MESSAGE = new Uint8Array([0, 0, 0, 21])

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
}

/** @returns The public identifier of the key used to encrypt `str` */
export const keyUsed = (str: string): Uint8Array =>
  toUint8Array(str).slice(4, 56)
