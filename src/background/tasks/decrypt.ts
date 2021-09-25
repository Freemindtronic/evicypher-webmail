/**
 * Decryption tasks.
 *
 * - {@link decrypt} is used to decrypt strings;
 *
 * @module
 */

import type { BackgroundTask } from '$/task'
import { debug } from 'debug'
import { get } from 'svelte/store'
import { BrowserStore } from '$/browser-store'
import { ErrorMessage, ExtensionError } from '$/error'
import { EviCrypt, keyUsed } from '$/legacy-code/cryptography/EviCrypt'
import { fetchAndSaveKeys } from '$/legacy-code/network/exchange'
import { favoritePhone } from '$/phones'
import { State } from '$/report'
/**
 * Sends a decryption request to the favorite phone. The decryption is performed locally.
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
      throw new ExtensionError(ErrorMessage.FavoritePhoneUndefined)

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

export const decryptFiles: BackgroundTask<
  undefined,
  Array<{ name: string; url: string }>,
  void
> = async function* (context, reporter, signal) {
  const files = yield

  await BrowserStore.allLoaded

  // Fetch the cerificate of the favorite phone in browser storage
  const phone = get(favoritePhone)

  if (phone === undefined)
    throw new ExtensionError(ErrorMessage.FavoritePhoneUndefined)

  const firstFile = files.pop()
  if (!firstFile) throw new Error('Array of files cannot be empty.')

  const blob = await (await fetch(firstFile.url)).blob()
  const file = new Blob([blob])
  URL.revokeObjectURL(firstFile.url)

  const buffer = await readAsArrayBuffer(file)

  // Send a request to the FMT app
  const keys = await fetchAndSaveKeys(context, phone, {
    reporter,
    signal,
    keyToGet: buffer.slice(5, 57),
  })

  // Encrypt the text
  const evi = new EviCrypt(keys)

  // Parallelize decryption
  // Note: since the decryption is done by CryptoJS, it is not possible
  // to effectively parallize tasks, they are run in the same thread
  await Promise.allSettled(
    [
      // Download all the files from `blob:` URLs
      Promise.resolve({ url: firstFile.url, buffer }),
      ...files.map(async ({ name, url }) => {
        const blob = await (await fetch(url)).blob()
        const file = new File([blob], name)
        URL.revokeObjectURL(firstFile.url)
        return { url, buffer: await readAsArrayBuffer(file) }
      }),
    ].map(async (file) => {
      const { url, buffer } = await file
      try {
        // Decrypt the file
        const decryptedFile = await evi.decryptFileBuffer(
          buffer,
          (progress: number) => {
            reporter({
              state: State.SubtaskInProgress,
              taskId: url,
              progress,
            })
          }
        )

        // Report the decrypted file
        reporter({
          state: State.SubtaskComplete,
          taskId: url,
          name: decryptedFile.name,
          url: URL.createObjectURL(decryptedFile),
        })
      } catch (error: unknown) {
        debug('task:encrypt-files:background')('%o', error)

        // Report the error and mark the subtask as failed
        reporter({
          state: State.SubtaskFailed,
          taskId: url,
          message:
            error instanceof ExtensionError
              ? error.message
              : ErrorMessage.UnknownError,
        })
      }
    })
  )
}

/** @returns A promise wrapping an `Uint8Array` */
const readAsArrayBuffer = async (file: Blob) =>
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
