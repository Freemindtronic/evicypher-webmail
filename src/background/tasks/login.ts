/**
 * Login tasks.
 *
 * - {@link login} is used to fetch credentials
 *
 * @module
 */

import type { BackgroundTask } from '~src/task'
import { get } from 'svelte/store'
import { ErrorMessage, ExtensionError } from '~src/error'
import { fetchAndSaveCredentials } from '~src/legacy-code/network/exchange'
import { uint8ArrayToString } from '~src/legacy-code/utils'
import { favoritePhone } from '~src/phones'

/** Store the credentials informations fetch */
type Credential = {
  login: string
  password: string
}

/**
 * Sends a credential request to the favorite phone.
 *
 * @remarks
 *   `BackgroundTask<undefined, string, Credential>` means that the task sends
 *   nothing to the foreground, receives strings from the foreground (the string
 *   to encrypt), and returns a Credential at the end (an object containing
 *   login and password).
 * @param context - Background context
 * @param reporter - A callback called at every step of the task
 * @param signal - An abort signal
 * @returns The credentials @see Credential
 */
export const login: BackgroundTask<undefined, string, Credential> =
  async function* (context, reporter, signal) {
    const url = yield

    // Fetch the favorite phone in browser storage
    const phone = get(favoritePhone)
    if (phone === undefined)
      throw new ExtensionError(ErrorMessage.FavoritePhoneUndefined)

    const keys = await fetchAndSaveCredentials(context, phone, {
      websiteUrl: url,
      reporter,
      signal,
    })

    const login = keys.low === undefined ? '' : uint8ArrayToString(keys.low)
    return {
      login,
      password: uint8ArrayToString(keys.high),
    }
  }
