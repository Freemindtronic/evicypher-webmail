/* eslint-disable unicorn/filename-case */
import CryptoJS from 'crypto-js'
import {
  uint8ArrayToString,
  uint8ArrayToWordArray,
  wordArrayToUint8Array,
} from './utils'

type BlockCipherMode = typeof CryptoJS.mode.CBC
type Padding = typeof CryptoJS.pad.NoPadding

export class AesUtil {
  keySize: number
  iterationCount: number

  constructor(keySize: number, iterationCount: number) {
    this.keySize = keySize / 32
    this.iterationCount = iterationCount
  }

  generateKey(
    salt: Uint8Array,
    passPhrase: Uint8Array
  ): CryptoJS.lib.WordArray {
    // eslint-disable-next-line new-cap
    return CryptoJS.PBKDF2(
      uint8ArrayToString(passPhrase),
      uint8ArrayToWordArray(salt),
      { keySize: this.keySize, iterations: this.iterationCount }
    )
  }

  // eslint-disable-next-line max-params
  encrypt(
    iv: Uint8Array,
    salt: Uint8Array,
    passPhrase: Uint8Array,
    plainText: Uint8Array,
    mode: BlockCipherMode,
    padding: Padding
  ): Uint8Array {
    const key = this.generateKey(salt, passPhrase)
    const encrypted = CryptoJS.AES.encrypt(
      uint8ArrayToWordArray(plainText),
      key,
      { iv: uint8ArrayToWordArray(iv), mode, padding }
    )
    return wordArrayToUint8Array(encrypted.ciphertext)
  }

  // eslint-disable-next-line max-params
  decrypt(
    iv: Uint8Array,
    salt: Uint8Array,
    passPhrase: Uint8Array,
    CipherText: Uint8Array,
    mode: BlockCipherMode,
    padding: Padding
  ): Uint8Array {
    const key = this.generateKey(salt, passPhrase)
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: uint8ArrayToWordArray(CipherText),
    })
    const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
      iv: uint8ArrayToWordArray(iv),
      mode,
      padding,
    })
    return wordArrayToUint8Array(decrypted)
  }

  encryptCTR(
    iv: Uint8Array,
    salt: Uint8Array,
    passPhrase: Uint8Array,
    plainText: Uint8Array
  ): Uint8Array {
    return this.encrypt(
      iv,
      salt,
      passPhrase,
      plainText,
      CryptoJS.mode.CTR,
      CryptoJS.pad.NoPadding
    )
  }

  decryptCTR(
    iv: Uint8Array,
    salt: Uint8Array,
    passPhrase: Uint8Array,
    CipherText: Uint8Array
  ): Uint8Array {
    return this.decrypt(
      iv,
      salt,
      passPhrase,
      CipherText,
      CryptoJS.mode.CTR,
      CryptoJS.pad.NoPadding
    )
  }
}
