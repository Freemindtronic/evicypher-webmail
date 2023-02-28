/**
 * Cloud tasks.
 *
 * - {@link cloud} is used to fetch cloud key from the connected device
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
import { get } from 'svelte/store';
import { ErrorMessage, ExtensionError } from '~src/error';
import { fetchAndSaveCloudKey } from '~src/legacy-code/network/exchange';
import { uint8ArrayToString } from '~src/legacy-code/utils';
import { favoritePhone } from '~src/phones';
/**
 * Sends a cloud key request to the favorite phone.
 *
 * @remarks
 *   `BackgroundTask<undefined, string, CloudKey>` means that the task sends
 *   nothing to the foreground, receives strings from the foreground (the string
 *   to encrypt), and returns a CloudKey at the end (an object containing id and
 *   password).
 * @param context - Background context
 * @param reporter - A callback called at every step of the task
 * @param signal - An abort signal
 * @returns The credentials @see Credential
 */
export const cloud = 
// eslint-disable-next-line require-yield
function (context, reporter, signal) {
    return __asyncGenerator(this, arguments, function* () {
        // Fetch the favorite phone in browser storage
        const phone = get(favoritePhone);
        if (phone === undefined)
            throw new ExtensionError(ErrorMessage.FavoritePhoneUndefined);
        const keys = yield __await(fetchAndSaveCloudKey(context, phone, {
            reporter,
            signal,
        }));
        const id = keys.low === undefined ? '' : uint8ArrayToString(keys.low);
        return yield __await({
            id,
            password: uint8ArrayToString(keys.high),
        });
    });
};
//# sourceMappingURL=cloud.js.map