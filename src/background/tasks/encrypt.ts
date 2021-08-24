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
Q4A=
=GABk
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
