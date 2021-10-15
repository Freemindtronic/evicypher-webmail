/**
 * Login tasks.
 *
 * @module
 */

import type { BackgroundTask } from '~src/task'
import { get } from 'svelte/store'
import { ErrorMessage, ExtensionError } from '~src/error'
import { fetchAndSaveCredentials } from '~src/legacy-code/network/exchange'
import { uint8ArrayToString } from '~src/legacy-code/utils'
import { favoritePhone } from '~src/phones'

type Credential = {
  login: string
  password: string
}

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

    return {
      login: uint8ArrayToString(keys.low),
      password: uint8ArrayToString(keys.high),
    }
  }
