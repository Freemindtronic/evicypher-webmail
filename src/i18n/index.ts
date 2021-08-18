/**
 * Internationalization (i18n) functions.
 *
 * A few functions are directly re-exported from
 * [svelte-i18n](https://github.com/kaisermann/svelte-i18n/blob/main/docs/Methods.md).
 *
 * @remarks
 *   This module has side-effects: importing it will fetch the locale files.
 * @module
 */

import {
  getLocaleFromNavigator,
  init,
  locale as localeStore,
  register,
  _,
} from 'svelte-i18n'
import { derived } from 'svelte/store'
import { browser } from 'webextension-polyfill-ts'
import { BrowserStore } from '$/browser-store'
import { ErrorMessage } from '$/error'
import { Report, State } from '$/report'

// Re-export some functions from svelte-i18n
export { isLoading, locales, _ } from 'svelte-i18n'

/** Application locale. */
export const locale = new BrowserStore<string>('locale', localeStore, {
  storage: browser.storage.sync,
})

/** Translates an error message. */
// eslint-disable-next-line complexity
export const translateError = derived(_, ($_) => (error: ErrorMessage) => {
  switch (error) {
    case ErrorMessage.CANCELED_BY_USER:
      return $_('canceled-by-user')

    case ErrorMessage.CONFLICT:
      return $_('conflict')

    case ErrorMessage.FAVORITE_PHONE_UNDEFINED:
      return $_('favorite-phone-undefined')

    case ErrorMessage.FILE_NAME_TOO_LONG:
      return $_('file-name-too-long')

    case ErrorMessage.FILE_NOT_RECOGNIZED:
      return $_('file-not-recognized')

    case ErrorMessage.MAIL_CONTENT_UNDEFINED:
      return $_('mail-content-undefined')

    case ErrorMessage.PHONE_NAME_UNDEFINED:
      return $_('phone-name-undefined')

    case ErrorMessage.REFUSED_ON_PHONE:
      return $_('refused-on-phone')

    case ErrorMessage.REQUEST_TIMEOUT:
      return $_('request-timeout')

    case ErrorMessage.TOO_MANY_ATTEMPTS:
      return $_('too-many-attempts')

    case ErrorMessage.UNKNOWN_ERROR:
      return $_('unknown-error')

    case ErrorMessage.UNKNOWN_PHONE_ERROR:
      return $_('unknown-phone-error')

    case ErrorMessage.WRONG_KEY:
      return $_('wrong-key')

    // This switch statement is exhaustive
    // No default
  }
})

/** Translates a report. */
// eslint-disable-next-line complexity
export const translateReport = derived(_, ($_) => (report: Report) => {
  switch (report.state) {
    case State.NOTIFICATION_SENT:
      return $_('notification-sent')

    case State.WAITING_FOR_PHONE:
      return $_('waiting-for-phone')

    case State.WAITING_FOR_FIRST_RESPONSE:
      return $_('waiting-for-first-response')

    case State.SCANNING:
      throw new Error('Not implemented yet: State.SCANNING case')

    case State.SUBTASK_IN_PROGRESS:
    case State.SUBTASK_COMPLETE:
    case State.SUBTASK_FAILED:
      throw new Error('Not implemented yet: State.SUBTASK_* case')

    // This switch statement is exhaustive
    // No default
  }
})

/** Loads a locale. */
const loader = (locale: string) => async () =>
  (await fetch(browser.runtime.getURL(`locales/${locale}/strings.json`))).json()

// Register languages
register('en', loader('en'))
register('fr', loader('fr'))

// Initialize FormatJS
init({
  fallbackLocale: 'en',
  initialLocale: getLocaleFromNavigator(),
})
