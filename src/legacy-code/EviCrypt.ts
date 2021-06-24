/* eslint-disable unicorn/filename-case */
import Base64 from 'base64-arraybuffer'

import {
  AesUtil,
  addJammingSimpleText,
  removeJammingSimpleText,
} from './AesUtil'
import * as utils from './utils'

const AES = new AesUtil(256, 1000)
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

  encryptText(plainText: string): string {
    const iv = utils.random(16)
    const salt = utils.random(32)
    const enc = AES.encryptCTR(
      iv,
      salt,
      this.keys.high,
      utils.utf8ToUint8Array(plainText)
    )

    const jam = addJammingSimpleText(
      utils.concatUint8Array(iv, salt),
      this.keys.low.slice(20),
      plainText.length
    )

    const keyID = utils
      .sha256(
        utils.concatUint8Array(this.keys.low.slice(0, 20), jam.slice(0, 32))
      )
      .slice(0, 20)

    const cA = new Uint8Array([...ID_MESSAGE, ...keyID, ...jam, ...enc])

    return utils.webSafe64(Base64.encode(cA))
  }

  decryptText(cipherText: string): string {
    const dataText = getArray(cipherText)

    let offset = 24

    const dataToDecipher = removeJammingSimpleText(
      dataText.slice(offset),
      this.keys.low.slice(20),
      48
    )
    offset += dataToDecipher.size

    const iv = dataToDecipher.data.slice(0, 16)
    const salt = dataToDecipher.data.slice(16, 48)

    const dec = AES.decryptCTR(iv, salt, this.keys.high, dataText.slice(offset))

    return utils.uint8ArrayToUTF8(dec)
  }
}

function getArray(base64: string) {
  return utils.b64ToUint8Array(utils.normal64(base64))
}
