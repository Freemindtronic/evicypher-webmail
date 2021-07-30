import type { BackgroundTask } from 'task'
import { get } from 'svelte/store'
import { BrowserStore } from 'browser-store'
import { ErrorMessage, ExtensionError } from 'error'
import { EviCrypt, keyUsed } from 'legacy-code/cryptography/EviCrypt'
import { fetchAndSaveKeys } from 'legacy-code/network/exchange'
import { favoritePhone } from 'phones'

/**
 * Sends a decryption request to the phone.
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
export const decrypt: BackgroundTask<undefined, string, string> =
  async function* (context, reporter, signal) {
    const str = yield

    await BrowserStore.allLoaded

    // Fetch the favorite phone in browser storage
    const phone = get(favoritePhone)
    if (phone === undefined)
      throw new ExtensionError(ErrorMessage.FAVORITE_PHONE_UNDEFINED)

    // Send a request to the FMT app
    const keys = await fetchAndSaveKeys(context, phone, {
      reporter,
      signal,
      keyToGet: keyUsed(str),
    })

    // Decrypt the text
    const evi = new EviCrypt(keys)
    return evi.decryptText(str)
  }

/**
 * Same, but with files. Instead of sendings blobs directly, we use
 * `URL.createObjectURL()`.
 */
export const decryptFile: BackgroundTask<
  undefined,
  { name: string; url: string },
  { name: string; url: string }
> = async function* (context, reporter, signal) {
  const { name, url } = yield

  await BrowserStore.allLoaded

  // Fetch the cerificate of the favorite phone in browser storage
  const phone = get(favoritePhone)

  if (phone === undefined)
    throw new ExtensionError(ErrorMessage.FAVORITE_PHONE_UNDEFINED)

  const blob = await (await fetch(url)).blob()
  const file = new File([blob], name)
  URL.revokeObjectURL(url)

  const buffer = await readAsArrayBuffer(file)

  // Send a request to the FMT app
  const keys = await fetchAndSaveKeys(context, phone, {
    reporter,
    signal,
    keyToGet: buffer.slice(5, 57),
  })

  // Encrypt the text
  const evi = new EviCrypt(keys)

  const decryptedFile = await evi.decryptFileBuffer(buffer, reporter)

  return { name: decryptedFile.name, url: URL.createObjectURL(decryptedFile) }
}

const readAsArrayBuffer = async (file: File) =>
  new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      resolve(new Uint8Array(reader.result as ArrayBuffer))
    })
    reader.addEventListener('error', () => {
      reject(reader.error)
    })
    reader.readAsArrayBuffer(file)
  })
