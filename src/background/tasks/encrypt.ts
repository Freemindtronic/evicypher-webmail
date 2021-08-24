/**
 * Encryption tasks.
 *
 * - {@link encrypt} is used to encrypt strings;
 * - {@link encryptFiles} is used to encrypt an array of files.
 *
 * @module
 */
import type { BackgroundTask } from '$/task'
import debug from 'debug'
import {
  createMessage,
  readKey,
  encrypt as encryptText,
  config as openpgpConfig,
} from 'openpgp'
import { get } from 'svelte/store'
import { BrowserStore } from '$/browser-store'
import { ErrorMessage, ExtensionError } from '$/error'
import { EviCrypt } from '$/legacy-code/cryptography/EviCrypt'
import { fetchAndSaveKeys } from '$/legacy-code/network/exchange'
import { favoritePhone } from '$/phones'
import { State } from '$/report'
import { version } from '~/package.json'

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
  async function* (_context, _reporter, _signal) {
    const text = yield

    const message = await createMessage({ text })

    const encryptionKeys = await readKey({
      armoredKey: `-----BEGIN PGP PUBLIC KEY BLOCK-----

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
=FCQu
-----END PGP PUBLIC KEY BLOCK-----`,
    })

    return encryptText({
      message,
      encryptionKeys,
      config: {
        showVersion: true,
        versionString: `EviCypher Webmail ${version} (${openpgpConfig.versionString})`,
      },
    })
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
    throw new ExtensionError(ErrorMessage.FavoritePhoneUndefined)

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
              state: State.SubtaskInProgress,
              taskId: url,
              progress,
            })
          }),
          encryptedName
        )

        // Report the encrypted file
        reporter({
          state: State.SubtaskComplete,
          taskId: url,
          name: encryptedName,
          url: URL.createObjectURL(encryptedFile),
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
