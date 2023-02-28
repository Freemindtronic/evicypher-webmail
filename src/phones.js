/**
 * Phone management functions.
 *
 * - {@link Phone} contains details about a paired phone.
 * - {@link phones} is the list of all paired phones, saved in a {@link BrowserStore}.
 * - {@link favoritePhone} is the phone to use for all operations.
 *
 * @remarks
 *   All variables are stores, which means they must have a `$` symbol beforehand
 *   to access their value: `Phone {$favoritePhone.name} connected`. (Or use
 *   `svelte/store.get`.)
 * @module
 */
import { derived, writable, get } from 'svelte/store';
import { browser } from 'webextension-polyfill-ts';
import { BrowserStore } from '$/browser-store';
import { Certificate } from '$/certificate';
/** Represents a phone, with a unique identifier and a name. */
export class Phone {
    /** Initializes a new phone with the arguments given. */
    constructor(id, name, certificate, lastSeen) {
        this.id = id;
        this.name = name;
        this.lastSeen = lastSeen !== null && lastSeen !== void 0 ? lastSeen : Date.now();
        this.certificate = certificate;
    }
    /** Transform an object coming from JSON.parse into a Phone object. */
    static fromJSON({ id, name, lastSeen, certificate, }) {
        return new Phone(id, name, Certificate.fromJSON(certificate), lastSeen);
    }
    /** Produces a JSON-serializable object. */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            lastSeen: this.lastSeen,
            certificate: this.certificate.toJSON(),
        };
    }
    /** Returns true if the phone was last seen less than 2 minutes ago. */
    get isOnline() {
        return this.lastSeen + 120000 > Date.now();
    }
}
/** Phone list. */
export const phones = new BrowserStore('phones', writable([]), {
    fromJSON: (x) => x.map((obj) => writable(Phone.fromJSON(obj))),
    toJSON: (x) => x.map((obj) => get(obj)),
});
// Add a subscriber to every new phone
phones.subscribe(($phones) => {
    for (const phone of $phones) {
        if ('subscribed' in phone)
            continue;
        // @ts-expect-error We add a "subscribed" property to avoid subscribing several times
        phone.subscribed = true;
        // Do not run the listener on first subscription; if the listener is
        // called on the first subscription, it would cause a load-save-load
        // situation, leading to inconsistencies...
        let first = true;
        phone.subscribe(() => {
            if (first)
                return;
            phones.update(($phones) => $phones);
        });
        first = false;
    }
});
/** Produce an auto-incremented integer. */
export const nextPhoneId = async () => {
    const { nextPhoneId: currentValue } = (await browser.storage.local.get({
        nextPhoneId: 1,
    }));
    await browser.storage.local.set({ nextPhoneId: currentValue + 1 });
    return currentValue;
};
/** Favorite phone id in the list {@link phones}. */
export const favoritePhoneId = new BrowserStore('favoritePhoneId', writable(-1));
/**
 * The favorite phone is a read-only store derived from two writable stores, it
 * updates whenever one of the two updates.
 */
export const favoritePhone = derived([phones, favoritePhoneId], ([$phones, $favoritePhoneId]) => $phones.find((phone) => get(phone).id === $favoritePhoneId));
//# sourceMappingURL=phones.js.map