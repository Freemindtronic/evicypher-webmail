import { BrowserStore } from 'browser-store'
import { fetchKeys } from 'legacy-code/Client'
import { EviCrypt, keyUsed } from 'legacy-code/EviCrypt'
import { favoritePhone } from 'phones'
import { get } from 'svelte/store'
import type { BackgroundTask } from 'task'

/** Send an decryption request to the phone, return the decrypted text. */
export const decrypt: BackgroundTask<undefined, string, string> =
  async function* (context, reporter, signal) {
    const str = yield

    await BrowserStore.allLoaded

    // Fetch the favorite phone in browser storage
    const phone = get(favoritePhone)
    if (phone === undefined) throw new Error('No favorite device set.')

    const $phone = get(phone)

    // Send a request to the FMT app
    const { keys, newCertificate } = await fetchKeys(
      context,
      $phone.certificate,
      {
        reporter,
        signal,
        keyToGet: keyUsed(str),
      }
    )
    $phone.certificate = newCertificate
    phone.update(($phone) => $phone)

    // Decrypt the text
    const evi = new EviCrypt(keys)
    return evi.decryptText(str)
  }
