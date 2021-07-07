import { BrowserStore } from 'browser-store'
import { fetchKeys } from 'legacy-code/Client'
import { EviCrypt } from 'legacy-code/EviCrypt'
import { favoritePhone, phones } from 'phones'
import { get } from 'svelte/store'
import type { BackgroundTask } from 'task'

/** Send an encryption request to the phone, return the encrypted text. */
export const encrypt: BackgroundTask<string, never, string, never> =
  // eslint-disable-next-line require-yield
  async function* (str, reporter, signal) {
    await BrowserStore.allLoaded

    // Fetch the cerificate of the favorite phone in browser storage
    const phone = get(favoritePhone)

    if (phone === undefined) throw new Error('No favorite device set.')

    // Send a request to the FMT app
    const { keys, newCertificate } = await fetchKeys(phone.certificate, {
      reporter,
      signal,
    })
    phone.certificate = newCertificate
    phones.update(($phones) => $phones)

    // Encrypt the text
    const evi = new EviCrypt(keys)
    return evi.encryptText(str)
  }
