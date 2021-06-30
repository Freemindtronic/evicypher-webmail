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

export function xor(a: Uint8Array, b: Uint8Array): Uint8Array {
  return a.length > b.length
    ? b.map((v, i) => v ^ a[i])
    : a.map((v, i) => v ^ b[i])
}

// eslint-disable-next-line max-params
export function removeJamming(
  jam: Uint8Array,
  data: Uint8Array,
  pos: number,
  posjam: number,
  shift: number
): Uint8Array {
  const part1 = new Uint8Array(data.slice(0, pos))
  const part2 = new Uint8Array(data.slice(pos + 1, data.length + 1))
  let final = concatUint8Array(part1, part2)
  final = xor(shiftRight(final, shift), jam)
  const posValue = data[pos] ^ posjam
  return final.slice(0, posValue)
}

export function concatUint8Array(a: Uint8Array, b: Uint8Array): Uint8Array {
  return new Uint8Array([...a, ...b])
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

export function addJammingSimpleText(
  data: Uint8Array,
  jam: Uint8Array,
  len: number
): Uint8Array {
  let min = 256 - len
  if (min < 0) min = 0
  const jamSize = min

  const cA = addJammingHelper(data, jam, jamSize, false)
  return new Uint8Array(cA)
}

export function addJammingSimple(
  data: Uint8Array,
  jam: Uint8Array
): Uint8Array {
  const jamSize = 24
  return addJammingHelper(data, jam, jamSize, true)
}

function addJammingHelper(
  data: Uint8Array,
  jam: Uint8Array,
  jamSize: number,
  isFile: boolean
): Uint8Array {
  const shift = 59
  const rnd = window.crypto.getRandomValues(new Uint8Array(jamSize))
  const pos = data.length

  const jam1: number[] = isFile ? [data.length ^ jam[1]] : []

  const cAshift = concatUint8Array(rnd, shiftLeft(data, shift))
  return new Uint8Array([
    pos ^ jam[0],
    ...cAshift.slice(0, pos),
    ...jam1,
    shift ^ jam[2],
    jamSize ^ jam[3],
    ...cAshift.slice(pos, cAshift.length + 1),
  ])
}

export function removeJammingSimpleText(
  data: Uint8Array,
  jam: Uint8Array,
  len: number
): {
  size: number
  data: Uint8Array
} {
  return removeJammingHelper(data, jam, len, 3)
}

export function removeJammingHelper(
  data: Uint8Array,
  jam: Uint8Array,
  len: number,
  offset: number
): {
  size: number
  data: Uint8Array
} {
  const pos = data[0] ^ jam[0]
  const shift = data[1 + pos] ^ jam[2]
  const jamSize = data[2 + pos] ^ jam[3]
  const part1 = data.slice(1, pos + 1)
  const part2 = data.slice(pos + offset, data.length + 1)
  const final = concatUint8Array(part1, part2)
  const start = jamSize
  const end = start + len

  return {
    size: jamSize + offset + len,
    data: shiftRight(final.slice(start, end), shift),
  }
}
