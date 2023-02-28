/**
 * Decryption tasks.
 *
 * - {@link decrypt} is used to decrypt strings;
 * - {@link decryptFiles} is used to decrypt an array of files.
 *
 * @module
 */
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
import { debug } from 'debug';
import { fromUint8Array } from 'js-base64';
import { readMessage, decrypt as pgpDecrypt } from 'openpgp';
import { get } from 'svelte/store';
import { BrowserStore } from '$/browser-store';
import { ErrorMessage, ExtensionError } from '$/error';
import { EviCrypt, keyUsed } from '$/legacy-code/cryptography/evicrypt';
import { fetchAndSaveKeys } from '$/legacy-code/network/exchange';
import { favoritePhone } from '$/phones';
import { State } from '$/report';
import { isOpenpgpEnabled } from '~src/options';
/**
 * Sends a decryption request to the favorite phone. The decryption is performed locally.
 *
 * @remarks
 *   `BackgroundTask<undefined, string, string>` means that the task sends nothing
 *   to the foreground, receives strings from the foreground (the string to
 *   decrypt), and returns a string at the end (the decrypted string).
 * @param context - Background context
 * @param reporter - A callback called at every step of the task
 * @param signal - An abort signal
 * @returns The decrypted string
 */
export const decrypt = function (context, reporter, signal) {
    return __asyncGenerator(this, arguments, function* () {
        const msgToDecrypt = yield yield __await(void 0);
        if (get(isOpenpgpEnabled))
            return yield __await(decryptOpenpgp(msgToDecrypt, context, reporter, signal));
        return yield __await(decryptLegacy(msgToDecrypt, context, reporter, signal));
    });
};
/** Decrypt using legacy method */
async function decryptLegacy(msgToDecrypt, context, reporter, signal) {
    await BrowserStore.allLoaded;
    // Fetch the favorite phone in browser storage
    const phone = get(favoritePhone);
    if (phone === undefined)
        throw new ExtensionError(ErrorMessage.FavoritePhoneUndefined);
    // Send a request to the FMT app
    const keys = await fetchAndSaveKeys(context, phone, {
        reporter,
        signal,
        keyToGet: keyUsed(msgToDecrypt),
    });
    // Decrypt the text
    const evi = new EviCrypt(keys);
    return evi.decryptText(msgToDecrypt);
}
/** Decrypt using OpenPgp */
async function decryptOpenpgp(armoredMessage, context, reporter, signal) {
    let message;
    try {
        message = await readMessage({ armoredMessage });
    }
    catch (_a) {
        throw new ExtensionError(ErrorMessage.FormatNotImplemented);
    }
    await BrowserStore.allLoaded;
    // Fetch the favorite phone in browser storage
    const phone = get(favoritePhone);
    if (phone === undefined)
        throw new ExtensionError(ErrorMessage.FavoritePhoneUndefined);
    // Send a request to the FMT app
    const keys = await fetchAndSaveKeys(context, phone, {
        reporter,
        signal,
    });
    // Decrypt the text
    try {
        const decrypted = await pgpDecrypt({
            message,
            passwords: fromUint8Array(keys.high),
        });
        return decrypted.data;
    }
    catch (_b) {
        throw new ExtensionError(ErrorMessage.PrivateKeyIncorrectPassphrase);
    }
}
/**
 * Decrypts files locally with keys fetched from the favorite phone.
 *
 * @remarks
 *   The files are not sent directly to the task, but through `blob:` URL. (see
 *   https://stackoverflow.com/a/30881444)
 *
 *   The task returns `undefined` because decrypted files are reported when ready.
 *   Subtasks of decryption can be tracked through `SUBTASK_IN_PROGRESS`,
 *   `SUBTASK_COMPLETE` and `SUBTASK_FAILED` reports.
 */
export const decryptFiles = function (context, reporter, signal) {
    return __asyncGenerator(this, arguments, function* () {
        const files = yield yield __await(void 0);
        yield __await(BrowserStore.allLoaded
        // Fetch the certificate of the favorite phone in browser storage
        );
        // Fetch the certificate of the favorite phone in browser storage
        const phone = get(favoritePhone);
        if (phone === undefined)
            throw new ExtensionError(ErrorMessage.FavoritePhoneUndefined);
        const firstFile = files.pop();
        if (!firstFile)
            throw new Error('Array of files cannot be empty.');
        const response = yield __await(fetch(firstFile.url));
        const blob = yield __await(response.blob());
        const file = new Blob([blob]);
        URL.revokeObjectURL(firstFile.url);
        const buffer = yield __await(readAsArrayBuffer(file)
        // Send a request to the FMT app
        );
        // Send a request to the FMT app
        const keys = yield __await(fetchAndSaveKeys(context, phone, {
            reporter,
            signal,
            keyToGet: buffer.slice(5, 57),
        })
        // Encrypt the text
        );
        // Encrypt the text
        const evi = new EviCrypt(keys);
        // Parallelize decryption
        // Note: since the decryption is done by CryptoJS, it is not possible
        // to effectively parallelize tasks, they are run in the same thread
        yield __await(Promise.allSettled([
            // Download all the files from `blob:` URLs
            Promise.resolve({ url: firstFile.url, buffer }),
            ...files.map(async ({ name, url }) => {
                const response = await fetch(url);
                const blob = await response.blob();
                const file = new File([blob], name);
                URL.revokeObjectURL(firstFile.url);
                return { url, buffer: await readAsArrayBuffer(file) };
            }),
        ].map(async (file) => {
            const { url, buffer } = await file;
            try {
                // Decrypt the file
                const decryptedFile = await evi.decryptFileBuffer(buffer, (progress) => {
                    reporter({
                        state: State.SubtaskInProgress,
                        taskId: url,
                        progress,
                    });
                });
                // Report the decrypted file
                reporter({
                    state: State.SubtaskComplete,
                    taskId: url,
                    name: decryptedFile.name,
                    url: URL.createObjectURL(decryptedFile),
                });
            }
            catch (error) {
                debug('task:encrypt-files:background')('%o', error);
                // Report the error and mark the subtask as failed
                reporter({
                    state: State.SubtaskFailed,
                    taskId: url,
                    message: error instanceof ExtensionError
                        ? error.message
                        : ErrorMessage.UnknownError,
                });
            }
        })));
    });
};
/** @returns A promise wrapping an `Uint8Array` */
const readAsArrayBuffer = async (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
        resolve(new Uint8Array(reader.result));
    });
    reader.addEventListener('error', () => {
        reject(reader.error);
    });
    reader.readAsArrayBuffer(file);
});
//# sourceMappingURL=decrypt.js.map