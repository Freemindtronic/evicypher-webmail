/**
 * Cloud tasks.
 *
 * - {@link cloud} is used to fetch cloud key from the connected device
 *
 * @module
 */

import type { BackgroundTask } from '~src/task'
import { get } from 'svelte/store'
import { ErrorMessage, ExtensionError } from '~src/error'
import { fetchAndSaveCloudKey } from '~src/legacy-code/network/exchange'
import { uint8ArrayToString } from '~src/legacy-code/utils'
import { favoritePhone } from '~src/phones'

/** Store the secret informations fetched */
export type CloudKey = {
  id: string
  password: string
}

/**
 * Sends a cloud key request to the favorite phone.
 *
 * @remarks
 *   `BackgroundTask<undefined, string, CloudKey>` means that the task sends
 *   nothing to the foreground, receives strings from the foreground (the string
 *   to encrypt), and returns a CloudKey at the end (an object containing id and
 *   password).
 * @param context - Background context
 * @param reporter - A callback called at every step of the task
 * @param signal - An abort signal
 * @returns The credentials @see Credential
 */
export const cloud: BackgroundTask<undefined, undefined, CloudKey> =
  // eslint-disable-next-line require-yield
  async function* (context, reporter, signal) {
    // Fetch the favorite phone in browser storage
    const phone = get(favoritePhone)
    if (phone === undefined)
      throw new ExtensionError(ErrorMessage.FavoritePhoneUndefined)

    const keys = await fetchAndSaveCloudKey(context, phone, {
      reporter,
      signal,
    })

    return {
      id: uint8ArrayToString(keys.low),
      password: uint8ArrayToString(keys.high),
    }
  }
