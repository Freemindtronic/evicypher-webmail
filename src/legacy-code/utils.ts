import CryptoJS from 'crypto-js'

/**
 * @remarks
 *   This should NOT be used to produce encryption keys.
 *   https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues#usage_notes
 * @returns An Uint8Array of `size` bytes
 */
export function random(size: number): Uint8Array {
  const array = new Uint8Array(size)
  return crypto.getRandomValues(array)
}

export function sha256(data: Uint8Array): Uint8Array {
  // eslint-disable-next-line new-cap
  return wordArrayToUint8Array(CryptoJS.SHA256(uint8ArrayToString(data)))
}

export function sha512(data: Uint8Array): Uint8Array {
  // eslint-disable-next-line new-cap
  return wordArrayToUint8Array(CryptoJS.SHA512(uint8ArrayToString(data)))
}

export function uint8ArrayToWordArray(ba: Uint8Array): CryptoJS.lib.WordArray {
  const wa: number[] = []
  for (const [i, element] of ba.entries()) {
    wa[Math.trunc(i / 4)] |= element << (24 - 8 * i)
  }

  return CryptoJS.lib.WordArray.create(wa, ba.length)
}

export function uint8ArrayToString(ta: Uint8Array): string {
  return String.fromCharCode(...ta)
}

export function wordArrayToUint8Array(
  word: CryptoJS.lib.WordArray
): Uint8Array {
  let length = word.sigBytes
  const wordArray = word.words

  const result = []
  let i = 0
  while (length > 0) {
    const bytes = wordToByteArray(wordArray[i], Math.min(4, length))
    length -= bytes.length
    result.push(bytes)
    i++
  }

  return new Uint8Array(result.flat())
}

function wordToByteArray(word: number, length: number): number[] {
  const ba = []
  const xFF = 0xff
  if (length > 0) ba.push(word >>> 24)
  if (length > 1) ba.push((word >>> 16) & xFF)
  if (length > 2) ba.push((word >>> 8) & xFF)
  if (length > 3) ba.push(word & xFF)
  return ba
}

/** Convert a number to a little-endian quadruple. */
export const longToByteArray = (
  long: number
): [number, number, number, number] => [
  long & 0xff,
  (long & 0xff_00) >> 8,
  (long & 0xff_00_00) >> 16,
  (long & 0xff_00_00_00) >> 24,
]

export function xor(a: Uint8Array, b: Uint8Array): Uint8Array {
  return a.length > b.length
    ? b.map((v, i) => v ^ a[i])
    : a.map((v, i) => v ^ b[i])
}

export function uint8ArrayToUTF8(data: Uint8Array): string {
  return new TextDecoder('utf-8').decode(data)
}

export function uint8ToHex(uint8: Uint8Array): string {
  // eslint-disable-next-line unicorn/no-array-reduce
  return uint8.reduce(
    (str, byte) => str + byte.toString(16).padStart(2, '0'),
    ''
  )
}

export function utf8ToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

export function concatUint8Array(a: Uint8Array, b: Uint8Array): Uint8Array {
  return new Uint8Array([...a, ...b])
}
