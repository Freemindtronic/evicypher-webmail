/* eslint-disable unicorn/filename-case */
import CryptoJS from 'crypto-js'
import { uint8ArrayToWordArray, wordArrayToUint8Array } from '../utils'

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
      String.fromCharCode(...passPhrase),
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

// eslint-disable-next-line complexity, sonarjs/cognitive-complexity
export function shiftLeft(
  byteArray: Uint8Array,
  shiftBitCount: number
): Uint8Array {
  const ouptut = new Uint8Array(byteArray.length)
  const shiftMod = shiftBitCount % 8

  const carryMask = (1 << shiftMod) - 1

  const offsetBytes = Math.floor((shiftBitCount / 8) % byteArray.length)
  let sourceIndex
  for (let i = 0; i < byteArray.length; i++) {
    sourceIndex = i + offsetBytes
    if (sourceIndex > byteArray.length) {
      break
    } else {
      const src = byteArray[sourceIndex]
      let dst = src << shiftMod
      dst |=
        sourceIndex + 1 < byteArray.length
          ? (byteArray[sourceIndex + 1] >>> (8 - shiftMod)) & carryMask
          : (byteArray[0] >>> (8 - shiftMod)) & carryMask
      ouptut[i] = dst
    }
  }

  for (let i = 0; i < offsetBytes; i++) {
    // If(byteArray.length-offsetBytes+i===byteArray.length-1)break;
    const src = byteArray[i]
    let dst = src << shiftMod
    if (i + 1 < offsetBytes) {
      dst |= (byteArray[i + 1] >>> (8 - shiftMod)) & carryMask
    }

    ouptut[byteArray.length - offsetBytes + i] = dst
  }

  if (shiftMod !== 0 && carryMask !== 0 && offsetBytes !== 0) {
    const src = byteArray[offsetBytes - 1]
    let dst = src << shiftMod
    dst |= (byteArray[offsetBytes] >>> (8 - shiftMod)) & carryMask
    ouptut[byteArray.length - 1] |= dst
  }

  return ouptut
}

export function shiftRight(
  byteArray: Uint8Array,
  shiftBitCount: number
): Uint8Array {
  const offsetBytes = Math.floor(shiftBitCount % (byteArray.length * 8))
  return shiftLeft(byteArray, byteArray.length * 8 - offsetBytes)
}
