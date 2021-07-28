/* eslint-disable max-params */

/**
 * This file contains "jamming," a custom cryptography that only makes
 * implementation more difficult and error prone.
 * https://security.stackexchange.com/q/18197
 *
 * Since I have no idea what this does, I'm not going to document it.
 *
 * @module
 */

import { shiftLeft, shiftRight } from './AesUtil'
import { xor } from './utils'

export function addJammingSimpleText(
  data: Uint8Array,
  jam: Uint8Array,
  len: number
): Uint8Array {
  let min = 256 - len
  if (min < 0) min = 0
  const jamSize = min
  return addJammingHelper(data, jam, jamSize, false)
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
  const rnd = crypto.getRandomValues(new Uint8Array(jamSize))
  const pos = data.length
  const jam1: number[] = isFile ? [data.length ^ jam[1]] : []
  const cAshift = new Uint8Array([...rnd, ...shiftLeft(data, shift)])
  return new Uint8Array([
    pos ^ jam[0],
    ...cAshift.slice(0, pos),
    ...jam1,
    shift ^ jam[2],
    jamSize ^ jam[3],
    ...cAshift.slice(pos),
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

export function removeJammingSimple(
  data: Uint8Array,
  jam: Uint8Array
): { size: number; data: Uint8Array } {
  const pos = data[0] ^ jam[0]
  const dataLen = data[1 + pos] ^ jam[1]
  const shift = data[2 + pos] ^ jam[2]
  const jamSize = data[3 + pos] ^ jam[3]

  const part1 = data.slice(1, pos + 1)
  const part2 = data.slice(pos + 4, data.length + 1)

  const final = new Uint8Array([...part1, ...part2])

  const start = jamSize
  const end = start + dataLen

  return {
    size: jamSize + 4 + dataLen,
    data: shiftRight(final.slice(start, end), shift),
  }
}

export function removeJamming(
  jam: Uint8Array,
  data: Uint8Array,
  pos: number,
  posjam: number,
  shift: number
): Uint8Array {
  const part1 = new Uint8Array(data.slice(0, pos))
  const part2 = new Uint8Array(data.slice(pos + 1, data.length + 1))
  const final = new Uint8Array([...part1, ...part2])
  const posValue = data[pos] ^ posjam
  return xor(shiftRight(final, shift), jam).slice(0, posValue)
}

function removeJammingHelper(
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
  const final = new Uint8Array([...part1, ...part2])
  const start = jamSize
  const end = start + len

  return {
    size: jamSize + offset + len,
    data: shiftRight(final.slice(start, end), shift),
  }
}
