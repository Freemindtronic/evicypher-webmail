/**
 * See {@link Certificate}.
 *
 * @module
 */
import { fromUint8Array, toUint8Array } from 'js-base64';
const KEY_SIZE = 16;
/** A class to produce new certificates and to serialize them. */
export class Certificate {
    /** Initializes a certificate with the data given. */
    constructor({ id, jamming, fKey, sKey, tKey, }) {
        this.id = id;
        this.fKey = fKey;
        this.sKey = sKey;
        this.tKey = tKey;
        this.jamming = jamming;
    }
    /** Produces a new certificate, with random keys. */
    static generate() {
        return new Certificate({
            id: crypto.getRandomValues(new Uint8Array(KEY_SIZE)),
            fKey: crypto.getRandomValues(new Uint8Array(KEY_SIZE)),
            sKey: crypto.getRandomValues(new Uint8Array(KEY_SIZE)),
            tKey: crypto.getRandomValues(new Uint8Array(KEY_SIZE)),
            jamming: crypto.getRandomValues(new Uint8Array(KEY_SIZE)),
        });
    }
    /** Unserialize the certificate. */
    static fromJSON({ id, fKey, sKey, tKey, jamming, }) {
        return new Certificate({
            id: toUint8Array(id),
            fKey: toUint8Array(fKey),
            sKey: toUint8Array(sKey),
            tKey: toUint8Array(tKey),
            jamming: toUint8Array(jamming),
        });
    }
    /** Produces a JSON-serializable object. */
    toJSON() {
        return {
            id: fromUint8Array(this.id),
            fKey: fromUint8Array(this.fKey),
            sKey: fromUint8Array(this.sKey),
            tKey: fromUint8Array(this.tKey),
            jamming: fromUint8Array(this.jamming),
        };
    }
}
//# sourceMappingURL=certificate.js.map