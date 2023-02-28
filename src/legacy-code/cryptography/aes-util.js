/* eslint-disable no-bitwise */
import CryptoJS from 'crypto-js';
import { uint8ArrayToWordArray, wordArrayToUint8Array } from '../utils';
export class AesUtil {
    constructor(keySize, iterationCount) {
        this.keySize = keySize / 32;
        this.iterationCount = iterationCount;
    }
    generateKey(salt, passPhrase) {
        // eslint-disable-next-line new-cap
        return CryptoJS.PBKDF2(String.fromCodePoint(...passPhrase), uint8ArrayToWordArray(salt), { keySize: this.keySize, iterations: this.iterationCount });
    }
    // eslint-disable-next-line max-params
    encrypt(iv, salt, passPhrase, plainText, mode, padding) {
        const key = this.generateKey(salt, passPhrase);
        const encrypted = CryptoJS.AES.encrypt(uint8ArrayToWordArray(plainText), key, { iv: uint8ArrayToWordArray(iv), mode, padding });
        return wordArrayToUint8Array(encrypted.ciphertext);
    }
    // eslint-disable-next-line max-params
    decrypt(iv, salt, passPhrase, cipherText, mode, padding) {
        const key = this.generateKey(salt, passPhrase);
        const cipherParams = CryptoJS.lib.CipherParams.create({
            ciphertext: uint8ArrayToWordArray(cipherText),
        });
        const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
            iv: uint8ArrayToWordArray(iv),
            mode,
            padding,
        });
        return wordArrayToUint8Array(decrypted);
    }
    encryptCBC(iv, salt, passPhrase, plainText) {
        return this.encrypt(iv, salt, passPhrase, plainText, CryptoJS.mode.CBC, CryptoJS.pad.Pkcs7);
    }
    decryptCBC(iv, salt, passPhrase, cipherText) {
        return this.decrypt(iv, salt, passPhrase, cipherText, CryptoJS.mode.CBC, CryptoJS.pad.Pkcs7);
    }
    encryptCTR(iv, salt, passPhrase, plainText) {
        return this.encrypt(iv, salt, passPhrase, plainText, CryptoJS.mode.CTR, CryptoJS.pad.NoPadding);
    }
    decryptCTR(iv, salt, passPhrase, cipherText) {
        return this.decrypt(iv, salt, passPhrase, cipherText, CryptoJS.mode.CTR, CryptoJS.pad.NoPadding);
    }
}
// eslint-disable-next-line complexity, sonarjs/cognitive-complexity
export function shiftLeft(byteArray, shiftBitCount) {
    const ouptut = new Uint8Array(byteArray.length);
    const shiftMod = shiftBitCount % 8;
    const carryMask = (1 << shiftMod) - 1;
    const offsetBytes = Math.floor((shiftBitCount / 8) % byteArray.length);
    let sourceIndex;
    for (let i = 0; i < byteArray.length; i++) {
        sourceIndex = i + offsetBytes;
        if (sourceIndex > byteArray.length) {
            break;
        }
        else {
            const src = byteArray[sourceIndex];
            let dst = src << shiftMod;
            dst |=
                sourceIndex + 1 < byteArray.length
                    ? (byteArray[sourceIndex + 1] >>> (8 - shiftMod)) & carryMask
                    : (byteArray[0] >>> (8 - shiftMod)) & carryMask;
            ouptut[i] = dst;
        }
    }
    for (let i = 0; i < offsetBytes; i++) {
        // If(byteArray.length-offsetBytes+i===byteArray.length-1)break;
        const src = byteArray[i];
        let dst = src << shiftMod;
        if (i + 1 < offsetBytes)
            dst |= (byteArray[i + 1] >>> (8 - shiftMod)) & carryMask;
        ouptut[byteArray.length - offsetBytes + i] = dst;
    }
    if (shiftMod !== 0 && carryMask !== 0 && offsetBytes !== 0) {
        const src = byteArray[offsetBytes - 1];
        let dst = src << shiftMod;
        dst |= (byteArray[offsetBytes] >>> (8 - shiftMod)) & carryMask;
        ouptut[byteArray.length - 1] |= dst;
    }
    return ouptut;
}
export function shiftRight(byteArray, shiftBitCount) {
    const offsetBytes = Math.floor(shiftBitCount % (byteArray.length * 8));
    return shiftLeft(byteArray, byteArray.length * 8 - offsetBytes);
}
//# sourceMappingURL=aes-util.js.map