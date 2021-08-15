import type { BackgroundTask } from '$/task'
import debug from 'debug'
import { get } from 'svelte/store'
import { BrowserStore } from '$/browser-store'
import { ErrorMessage, ExtensionError } from '$/error'
import { EviCrypt } from '$/legacy-code/cryptography/EviCrypt'
import { fetchAndSaveKeys } from '$/legacy-code/network/exchange'
import { favoritePhone } from '$/phones'
import { State } from '$/report'

/**
 * Sends an encryption request to the favorite phone. The encryption is performed locally.
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

    if (phone === undefined)
      throw new ExtensionError(ErrorMessage.FAVORITE_PHONE_UNDEFINED)

    // Send a request to the FMT app
    const keys = await fetchAndSaveKeys(context, phone, {
      reporter,
      signal,
    })

    // Encrypt the text
    const evi = new EviCrypt(keys)
    return evi.encryptText(str)
  }

/**
 * Encrypts files locally with keys fetched from the favorite phone.
 *
 * @remarks
 *   The files are not sent directly to the task, but through `blob:` URL. (see
 *   https://stackoverflow.com/a/30881444)
 *
 *   The task returns `undefined` because encrypted files are reported when ready.
 *   Subtasks of encryption can be tracked through `SUBTASK_IN_PROGRESS`,
 *   `SUBTASK_COMPLETE` and `SUBTASK_FAILED` reports.
 */
export const encryptFiles: BackgroundTask<
  undefined,
  Array<{ name: string; url: string }>,
  void
> = async function* (context, reporter, signal) {
  const files = yield

  await BrowserStore.allLoaded

  // Fetch the cerificate of the favorite phone in browser storage
  const phone = get(favoritePhone)

  if (phone === undefined)
    throw new ExtensionError(ErrorMessage.FAVORITE_PHONE_UNDEFINED)

  // Send a request to the FMT app
  const keys = await fetchAndSaveKeys(context, phone, {
    reporter,
    signal,
  })

  // Encrypt the text
  const evi = new EviCrypt(keys)

  await Promise.allSettled(
    files.map(async ({ name, url }) => {
      // Download the file
      const blob = await (await fetch(url)).blob()
      const file = new File([blob], name)

      // Free the file
      URL.revokeObjectURL(url)

      try {
        // Random 8-letter string
        const encryptedName =
          [...crypto.getRandomValues(new Uint8Array(8))]
            .map((n) => String.fromCharCode(97 + (n % 26)))
            .join('') + '.Evi'

        // Encrypt the file
        const encryptedFile = new File(
          await evi.encryptFile(file, (progress: number) => {
            reporter({
              state: State.SUBTASK_IN_PROGRESS,
              taskId: url,
              progress,
            })
          }),
          encryptedName
        )

        // Report the encrypted file
        reporter({
          state: State.SUBTASK_COMPLETE,
          taskId: url,
          name: encryptedName,
          url: URL.createObjectURL(encryptedFile),
        })
      } catch (error: unknown) {
        debug('task:encrypt-files:background')('%o', error)

        // Report the error and mark the subtask as failed
        reporter({
          state: State.SUBTASK_FAILED,
          taskId: url,
          message:
            error instanceof ExtensionError
              ? error.message
              : ErrorMessage.UNKNOWN_ERROR,
        })
      }
    })
  )
}
