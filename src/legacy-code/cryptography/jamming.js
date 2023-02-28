/* eslint-disable no-bitwise */
/* eslint-disable max-params */
import { xor } from '../utils';
import { shiftLeft, shiftRight } from './aes-util';
export function addJammingSimpleText(data, jam, len) {
    let min = 256 - len;
    if (min < 0)
        min = 0;
    const jamSize = min;
    return addJammingHelper(data, jam, jamSize, false);
}
export function addJammingSimple(data, jam) {
    const jamSize = 24;
    return addJammingHelper(data, jam, jamSize, true);
}
function addJammingHelper(data, jam, jamSize, isFile) {
    const shift = 59;
    const rnd = crypto.getRandomValues(new Uint8Array(jamSize));
    const pos = data.length;
    const jam1 = isFile ? [data.length ^ jam[1]] : [];
    const cAshift = new Uint8Array([...rnd, ...shiftLeft(data, shift)]);
    return new Uint8Array([
        pos ^ jam[0],
        ...cAshift.slice(0, pos),
        ...jam1,
        shift ^ jam[2],
        jamSize ^ jam[3],
        ...cAshift.slice(pos),
    ]);
}
export function removeJammingSimpleText(data, jam, len) {
    return removeJammingHelper(data, jam, len, 3);
}
export function removeJammingSimple(data, jam) {
    const pos = data[0] ^ jam[0];
    const dataLen = data[1 + pos] ^ jam[1];
    const shift = data[2 + pos] ^ jam[2];
    const jamSize = data[3 + pos] ^ jam[3];
    const part1 = data.slice(1, pos + 1);
    const part2 = data.slice(pos + 4, data.length + 1);
    const final = new Uint8Array([...part1, ...part2]);
    const start = jamSize;
    const end = start + dataLen;
    return {
        size: jamSize + 4 + dataLen,
        data: shiftRight(final.slice(start, end), shift),
    };
}
export function removeJamming(jam, data, pos, posjam, shift) {
    const part1 = new Uint8Array(data.slice(0, pos));
    const part2 = new Uint8Array(data.slice(pos + 1, data.length + 1));
    const final = new Uint8Array([...part1, ...part2]);
    const posValue = data[pos] ^ posjam;
    return xor(shiftRight(final, shift), jam).slice(0, posValue);
}
function removeJammingHelper(data, jam, len, offset) {
    const pos = data[0] ^ jam[0];
    const shift = data[1 + pos] ^ jam[2];
    const jamSize = data[2 + pos] ^ jam[3];
    const part1 = data.slice(1, pos + 1);
    const part2 = data.slice(pos + offset, data.length + 1);
    const final = new Uint8Array([...part1, ...part2]);
    const start = jamSize;
    const end = start + len;
    return {
        size: jamSize + offset + len,
        data: shiftRight(final.slice(start, end), shift),
    };
}
//# sourceMappingURL=jamming.js.map