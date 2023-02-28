/**
 * Encryption tasks.
 *
 * - {@link encrypt} is used to encrypt strings;
 * - {@link encryptFiles} is used to encrypt an array of files.
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
import debug from 'debug';
import { fromUint8Array } from 'js-base64';
import { createMessage, encrypt as openpgpEncrypt, config as openpgpConfig, } from 'openpgp';
import { get } from 'svelte/store';
import { BrowserStore } from '$/browser-store';
import { ErrorMessage, ExtensionError } from '$/error';
import { EviCrypt } from '$/legacy-code/cryptography/evicrypt';
import { fetchAndSaveKeys } from '$/legacy-code/network/exchange';
import { favoritePhone } from '$/phones';
import { State } from '$/report';
import { version } from '~/package.json';
import { isOpenpgpEnabled } from '~src/options';
/**
 * Sends an encryption request to the favorite phone. The encryption is performed locally.
 *
 * @remarks
 *   `BackgroundTask<undefined, string, string>` means that the task sends nothing
 *   to the foreground, receives strings from the foreground (the string to
 *   encrypt), and returns a string at the end (the encrypted string).
 * @param context - Background context
 * @param reporter - A callback called at every step of the task
 * @param signal - An abort signal
 * @returns The encrypted string
 */
export const encrypt = function (context, reporter, signal) {
    return __asyncGenerator(this, arguments, function* () {
        const text = yield yield __await(void 0);
        yield __await(BrowserStore.allLoaded
        // Fetch the certificate of the favorite phone in browser storage
        );
        // Fetch the certificate of the favorite phone in browser storage
        const phone = get(favoritePhone);
        if (phone === undefined)
            throw new ExtensionError(ErrorMessage.FavoritePhoneUndefined);
        // Send a request to the FMT app
        const keys = yield __await(fetchAndSaveKeys(context, phone, {
            reporter,
            signal,
        })
        // If using OpenPGP encrypt text with AES key
        );
        // If using OpenPGP encrypt text with AES key
        if (get(isOpenpgpEnabled)) {
            return yield __await(openpgpEncrypt({
                message: yield __await(createMessage({ text })),
                passwords: fromUint8Array(keys.high),
                config: {
                    showVersion: true,
                    versionString: `EviCypher Webmail ${version} (${openpgpConfig.versionString})`,
                },
            }));
        }
        // If using legacy
        const evi = new EviCrypt(keys);
        return yield __await(evi.encryptText(text));
    });
};
/**
 * Encrypts files locally with keys fetched from the favorite phone.
 *
 * @remarks
 *   The files are not sent directly to the task, but through `blob:` URL. (see
 *   https://stackoverflow.com/a/30881444)
 *
 *   The task returns `undefined` because encrypted files are reported when ready.
 *   Subtasks of encryption can be tracked through `SUBTASK_IN_PROGRESS`,
 *   `SUBTASK_COMPLETE` and `SUBTASK_FAILED` reports.
 */
export const encryptFiles = function (context, reporter, signal) {
    return __asyncGenerator(this, arguments, function* () {
        const files = yield yield __await(void 0);
        yield __await(BrowserStore.allLoaded
        // Fetch the certificate of the favorite phone in browser storage
        );
        // Fetch the certificate of the favorite phone in browser storage
        const phone = get(favoritePhone);
        if (phone === undefined)
            throw new ExtensionError(ErrorMessage.FavoritePhoneUndefined);
        // Send a request to the FMT app
        const keys = yield __await(fetchAndSaveKeys(context, phone, {
            reporter,
            signal,
        })
        // Encrypt the text
        );
        // Encrypt the text
        const evi = new EviCrypt(keys);
        yield __await(Promise.allSettled(files.map(async ({ name, url }) => {
            // Download the file
            const response = await fetch(url);
            const blob = await response.blob();
            const file = new File([blob], name);
            // Free the file
            URL.revokeObjectURL(url);
            try {
                // Random 8-letter string
                const encryptedName = [...crypto.getRandomValues(new Uint8Array(8))]
                    .map((n) => String.fromCodePoint(97 + (n % 26)))
                    .join('') + '.Evi';
                // Encrypt the file
                const encryptedFile = new File(await evi.encryptFile(file, (progress) => {
                    reporter({
                        state: State.SubtaskInProgress,
                        taskId: url,
                        progress,
                    });
                }), encryptedName);
                // Report the encrypted file
                reporter({
                    state: State.SubtaskComplete,
                    taskId: url,
                    name: encryptedName,
                    url: URL.createObjectURL(encryptedFile),
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
//# sourceMappingURL=encrypt.js.map