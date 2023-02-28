/**
 * {@link pair | Pairing task.}
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
import { get, writable } from 'svelte/store';
import { ErrorMessage, ExtensionError } from '$/error';
import { clientHello, PairingKey } from '$/legacy-code/network/pair';
import { favoritePhone, favoritePhoneId, nextPhoneId, Phone, phones, } from '$/phones';
/**
 * Pairs the extension with a new phone.
 *
 * @remarks
 *   `BackgroundTask<string, string, boolean>` means that the task sends strings
 *   to the foreground (the QR code data and the UID), receives strings from the
 *   foreground (the name of the phone), and returns true at the end (if an
 *   error is encountered, an exception is thrown).
 * @param context - Background context
 * @param reporter - A callback called at every step of the task
 * @param signal - An abort signal
 * @returns Whether the pairing was successful
 */
export const pair = function (context, reporter, signal) {
    return __asyncGenerator(this, arguments, function* () {
        // Create a pairing QR code and send it to the front end
        const pairingKey = yield __await(PairingKey.generate());
        yield yield __await(pairingKey.qrData
        // Wait for the user to scan the code
        );
        // Wait for the user to scan the code
        const device = yield __await(clientHello(context, pairingKey, signal, reporter));
        const key = yield __await(device.clientKeyExchange()
        // Send the UID, and receive the name of the phone
        );
        // Send the UID, and receive the name of the phone
        const phoneName = yield yield __await(key.UUID);
        if (!phoneName)
            throw new ExtensionError(ErrorMessage.PhoneNameUndefined);
        // Finish the pairing process
        const certificate = yield __await(device.sendNameInfo(phoneName, key.ECC)
        // Add the phone to the list, as favorite if none is defined
        );
        // Add the phone to the list, as favorite if none is defined
        const $phone = new Phone(yield __await(nextPhoneId()), phoneName, certificate);
        const phone = writable($phone);
        // Register the new phone in the background context
        const networkEntry = context.network.get(device.IP);
        if (networkEntry)
            networkEntry.phone = { store: phone, keys: undefined };
        phones.update(($phones) => [...$phones, phone]);
        // Mark the phone as favorite if none is defined
        if (get(favoritePhone) === undefined)
            favoritePhoneId.set($phone.id);
        // Pairing successful, send true to the front end
        return yield __await(true);
    });
};
//# sourceMappingURL=pair.js.map