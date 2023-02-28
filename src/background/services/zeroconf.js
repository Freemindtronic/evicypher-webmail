/**
 * Zeroconf service.
 *
 * The service [asks a locally installed
 * software](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging)
 * ([EviDNS](https://github.com/Freemindtronic/eviDNS_zeroconf)) to scan the
 * network for devices.
 *
 * @modules
 */
import debug from 'debug';
import { get } from 'svelte/store';
import { browser } from 'webextension-polyfill-ts';
import { sendRequest } from '$/legacy-code/network/exchange';
import { phones } from '$/phones';
import { Request } from '../protocol';
/** Registry name of the service. */
const APPLICATION_ID = 'com.freemindtronic.evidns';
/** Time (in ms) between two scans. */
const DEFAULT_COOLDOWN = 10000;
/** Minimum time between two scans, even if `scanFaster` is set to true. */
const MINIMUM_COOLDOWN = 200;
/**
 * Checks that the Zeroconf service is installed, and with a compatible version.
 *
 * @returns Whether the Zeroconf service is properly installed
 */
export const isZeroconfServiceInstalled = async () => {
    const log = debug('service:zeroconf');
    try {
        const response = (await browser.runtime.sendNativeMessage(APPLICATION_ID, {
            cmd: 'Version',
        }));
        if (!response || !('version' in response))
            return false;
        // Print the version and check compatibility
        log(`Zeroconf version: ${response.version}.`);
        if (![1].includes(response.version)) {
            // The only compatible version is 1, update the array above
            // if more versions are supported
            // Note: `response.version` is the MAJOR version number
            console.error(`Zeroconf version ${response.version} is not compatible with this extension.`);
            return false;
        }
        return true;
    }
    catch (error) {
        console.error(error);
        return false;
    }
};
/**
 * Starts a persistent scanning service.
 *
 * @remarks
 *   This function returns instantaneously, but the promise returned never resolves.
 */
export const startZeroconfService = async (context) => {
    const log = debug('service:zeroconf');
    // Mark the service as started
    context.zeroconfRunning = true;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const start = performance.now();
        // A promise to a list of connected devices
        const promiseResponse = browser.runtime
            .sendNativeMessage(APPLICATION_ID, {
            cmd: 'Lookup',
            type: '_evitoken._tcp.',
        })
            .catch((error) => {
            log('%o', error);
            context.zeroconfRunning = false;
        });
        const response = (await promiseResponse);
        log('Scan results: %o', response === null || response === void 0 ? void 0 : response.result);
        if (response) {
            context.zeroconfRunning = true;
            await handleResponse(context, response);
        }
        // Prune devices that haven't been seen for a while
        pruneOldDevices(context);
        // Avoid scan spamming
        const duration = performance.now() - start;
        if (duration < MINIMUM_COOLDOWN)
            await delay(MINIMUM_COOLDOWN - duration);
        if (context.scanFaster.get())
            continue;
        await Promise.race([context.scanFaster.observe(), delay(DEFAULT_COOLDOWN)]);
    }
};
const delay = async (time) => new Promise((resolve) => {
    setTimeout(resolve, time);
});
/**
 * Updates the `context` with the `response`. If a new phone is found in the
 * response, it will be reached to get its name.
 */
const handleResponse = async (context, response) => {
    var _a, _b;
    const devicesFound = (_b = (_a = response.result) === null || _a === void 0 ? void 0 : _a.map(({ a: ip, port }) => ({ ip, port }))) !== null && _b !== void 0 ? _b : [];
    // Parallelize all requests
    await Promise.allSettled(devicesFound.map(async ({ ip, port }) => {
        // If the device is not yet known, try to associate it with its certificate
        if (!context.network.has(ip))
            await handleNewPhone(context, ip, port);
        // Update the `lastSeen` property of the phone
        const entry = context.network.get(ip);
        if (!entry)
            return;
        entry.lastSeen = Date.now();
        if (entry.phone !== undefined) {
            entry.phone.store.update(($phone) => {
                $phone.lastSeen = Date.now();
                return $phone;
            });
        }
    }));
};
/** Handles a phone seen for the first time. */
const handleNewPhone = async (context, ip, port) => {
    const log = debug('service:zeroconf:handleNewPhone');
    // Send a "ping" to get the name of the phone
    const phone = await pingNewPhone(context, ip, port);
    // If it's not a paired phone, only register its port
    if (phone === undefined) {
        context.network.set(ip, { port, lastSeen: Date.now(), phone: undefined });
        log('New unpaired phone found at %o', ip);
        return;
    }
    context.network.set(ip, {
        port,
        lastSeen: Date.now(),
        phone,
    });
    log('New phone found at %o (known as %o)', ip, get(phone.store).name);
    context.newDeviceFound.set();
};
/**
 * Tries to ping a phone to know if it's already saved.
 *
 * @returns Details about the phone, or `undefined` if it's not a paired phone.
 */
const pingNewPhone = async (context, ip, port) => {
    // Filter out phones that have already been found
    const $phones = new Set(get(phones));
    for (const { phone } of context.network.values())
        if (phone)
            $phones.delete(phone.store);
    // If 10 phones are paired with the extension, 10 requests will be sent to
    // the phone. This is far from optimal, but it's the best we can do with
    // the current protocol.
    for (const store of $phones) {
        const $phone = get(store);
        try {
            const pingResponse = await sendRequest({
                ip,
                port,
                type: Request.Ping,
                data: { t: $phone.certificate.id },
            });
            // The phone answered with a 2xx code, that's the right phone
            return { store, keys: { pingResponse, date: Date.now() } };
        }
        catch (_a) {
            // The phone refused the connection, let's try the next certificate
        }
    }
};
/** Removes devices last seen a long time ago. */
const pruneOldDevices = (context) => {
    for (const [ip, { lastSeen }] of context.network.entries())
        if (Date.now() > lastSeen + 60 * 60 * 1000)
            context.network.delete(ip);
};
//# sourceMappingURL=zeroconf.js.map