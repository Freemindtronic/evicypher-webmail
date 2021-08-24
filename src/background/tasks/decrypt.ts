/**
 * Decryption tasks.
 *
 * - {@link decrypt} is used to decrypt strings;
 * - {@link decryptFiles} is used to decrypt an array of files.
 *
 * @module
 */

import type { BackgroundTask } from '$/task'
import { debug } from 'debug'
import {
  decrypt as decryptText,
  decryptKey,
  readMessage,
  readPrivateKey,
} from 'openpgp'
import { get } from 'svelte/store'
import { BrowserStore } from '$/browser-store'
import { ErrorMessage, ExtensionError } from '$/error'
import { EviCrypt } from '$/legacy-code/cryptography/EviCrypt'
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
export const decrypt: BackgroundTask<string | undefined, string, string> =
  async function* (_context, _reporter, _signal) {
    const armoredMessage = yield

    const message = await readMessage({ armoredMessage })

    const encryptedKey = await readPrivateKey({
      armoredKey: `-----BEGIN PGP PRIVATE KEY BLOCK-----

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
lnVcu+64ysZ2+V08koUUhWbnQ4A=
=ndN0
-----END PGP PRIVATE KEY BLOCK-----`,
    })

    try {
      const privateKey = await decryptKey({
        privateKey: encryptedKey,
        // Note: the passphrase is "test"
        passphrase: yield encryptedKey.getUserIDs().join(''),
      })

      const decrypted = await decryptText({
        message,
        decryptionKeys: privateKey,
      })
      return decrypted.data
    } catch {
      throw new ExtensionError(ErrorMessage.PrivateKeyIncorrectPassphrase)
    }
  }

/**
 * Decrypts files locally with keys fetched from the favorite phone.
 *
 * @remarks
 *   The files are not sent directly to the task, but through `blob:` URL. (see
 *   https://stackoverflow.com/a/30881444)
 *
 *   The task returns `undefined` because decrypted files are reported when ready.
 *   Subtasks of decryption can be tracked through `SUBTASK_IN_PROGRESS`,
 *   `SUBTASK_COMPLETE` and `SUBTASK_FAILED` reports.
 */
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
