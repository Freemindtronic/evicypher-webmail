/* eslint-disable no-bitwise */
import CryptoJS from 'crypto-js';
/**
 * @remarks
 *   This should NOT be used to produce encryption keys.
 *   https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues#usage_notes
 * @returns An Uint8Array of `size` bytes
 */
export function random(size) {
    const array = new Uint8Array(size);
    return crypto.getRandomValues(array);
}
/**
 * Produces a SHA-256 hash of the data given.
 *
 * @remarks
 *   This hash is not interoperable with other implementations of SHA-256 because
 *   of a bug. See the comment in the source file for details.
 */
export const sha256 = async (data) => {
    // Because the previous developers had no idea that one cannot convert a
    // `Uint8Array` to a string without messing with encodings, we now need
    // this stupid workaround:
    data = new TextEncoder().encode(String.fromCodePoint(...data));
    // For instance, 200 is the ASCII code for È, thus `String.fromCharCode(200)`
    // produces `"È"`. However, JS strings are not ASCII but UCS-2.
    // (see https://mathiasbynens.be/notes/javascript-encoding)
    // When we convert the string back to a `Uint8Array`, we get the UTF-8
    // sequence for È: `[195, 136]`; therefore `[200]` becomes `[195, 136]`.
    // Values under 127 are encoded as a single byte, so they stay unchanged.
    return new Uint8Array(await crypto.subtle.digest('SHA-256', data));
};
/**
 * Produces a SHA-512 hash of the data given.
 *
 * @remarks
 *   This hash is not interoperable with other implementations of SHA-512 because
 *   of a bug. See {@link sha256}.
 */
export const sha512 = async (data) => new Uint8Array(await crypto.subtle.digest('SHA-512', new TextEncoder().encode(String.fromCodePoint(...data))));
export function uint8ArrayToWordArray(ba) {
    const wa = [];
    for (const [i, element] of ba.entries())
        wa[Math.trunc(i / 4)] |= element << (24 - 8 * i);
    return CryptoJS.lib.WordArray.create(wa, ba.length);
}
export function wordArrayToUint8Array(word) {
    let length = word.sigBytes;
    const wordArray = word.words;
    const result = [];
    let i = 0;
    while (length > 0) {
        const bytes = wordToByteArray(wordArray[i], Math.min(4, length));
        length -= bytes.length;
        result.push(bytes);
        i++;
    }
    return new Uint8Array(result.flat());
}
function wordToByteArray(word, length) {
    const ba = [];
    const xff = 0xff;
    if (length > 0)
        ba.push(word >>> 24);
    if (length > 1)
        ba.push((word >>> 16) & xff);
    if (length > 2)
        ba.push((word >>> 8) & xff);
    if (length > 3)
        ba.push(word & xff);
    return ba;
}
/** Convert a number to a little-endian quadruple. */
export const longToByteArray = (long) => [
    long & 0xff,
    (long & 65280) >> 8,
    (long & 16711680) >> 16,
    (long & 4278190080) >> 24,
];
export function xor(a, b) {
    return a.length > b.length
        ? b.map((v, i) => v ^ a[i])
        : a.map((v, i) => v ^ b[i]);
}
export function uint8ToHex(uint8) {
    return uint8.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
}
export function stringToUint8Array(string) {
    return new TextEncoder().encode(string);
}
export function uint8ArrayToString(array) {
    return new TextDecoder().decode(array);
}
//# sourceMappingURL=utils.js.map