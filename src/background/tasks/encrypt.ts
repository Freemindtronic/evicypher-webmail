import { BrowserStore } from 'browser-store'
import { fetchKeys } from 'legacy-code/Client'
import { EviCrypt } from 'legacy-code/EviCrypt'
import { favoritePhone } from 'phones'
import { get } from 'svelte/store'
import type { BackgroundTask } from 'task'

/**
 * Sends an encryption request to the phone.
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
export const encrypt: BackgroundTask<undefined, string, string> =
  async function* (context, reporter, signal) {
    const str = yield

    await BrowserStore.allLoaded

    // Fetch the cerificate of the favorite phone in browser storage
    const phone = get(favoritePhone)

    if (phone === undefined) throw new Error('No favorite device set.')
    const $phone = get(phone)

    // Send a request to the FMT app
    const { keys, newCertificate } = await fetchKeys(context, $phone, {
      reporter,
      signal,
    })
    $phone.certificate = newCertificate
    phone.update(($phone) => $phone)

    // Encrypt the text
    const evi = new EviCrypt(keys)
    return evi.encryptText(str)
  }
