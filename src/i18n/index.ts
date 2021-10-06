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
    case ErrorMessage.CanceledByUser:
      return $_('canceled-by-user')

    case ErrorMessage.Conflict:
      return $_('conflict')

    case ErrorMessage.FavoritePhoneUndefined:
      return $_('favorite-phone-undefined')

    case ErrorMessage.FileNameTooLong:
      return $_('file-name-too-long')

    case ErrorMessage.FileNotRecognized:
      return $_('file-not-recognized')

    case ErrorMessage.FormatNotImplemented:
      return $_('format-not-implemented')

    case ErrorMessage.MailContentUndefined:
      return $_('mail-content-undefined')

    case ErrorMessage.PhoneNameUndefined:
      return $_('phone-name-undefined')

    case ErrorMessage.PrivateKeyIncorrectPassphrase:
      return $_('the-passphrase-provided-is-incorrect')

    case ErrorMessage.RefuseOnPhone:
      return $_('refused-on-phone')

    case ErrorMessage.RequestTimeout:
      return $_('request-timeout')

    case ErrorMessage.TooManyAttempts:
      return $_('too-many-attempts')

    case ErrorMessage.UnknownError:
      return $_('unknown-error')

    case ErrorMessage.UnknownPhoneError:
      return $_('unknown-phone-error')

    case ErrorMessage.WrongKey:
      return $_('wrong-key')

    case ErrorMessage.CharacterLimit:
      return $_('character-limit-exceeded')
    // This switch statement is exhaustive
    // No default
  }
})

/** Translates a report. */
// eslint-disable-next-line complexity
export const translateReport = derived(_, ($_) => (report: Report) => {
  switch (report.state) {
    case State.NotificationSent:
      return $_('notification-sent')

    case State.WaitingForPhone:
      return $_('waiting-for-phone')

    case State.WaitingForFirstResponse:
      return $_('waiting-for-first-response')

    case State.Scanning:
      throw new Error('Not implemented yet: State.SCANNING case')

    case State.SubtaskInProgress:
    case State.SubtaskComplete:
    case State.SubtaskFailed:
      throw new Error('Not implemented yet: State.SUBTASK_* case')

    // This switch statement is exhaustive
    // No default
  }
})

/** Loads a locale. */
const loader = (locale: string) => async () =>
  (await fetch(browser.runtime.getURL(`locales/${locale}/strings.json`))).json()

// Register languages
register('ara', loader('ara'))
register('cat', loader('cat'))
register('de', loader('de'))
register('en', loader('en'))
register('es', loader('es'))
register('fr', loader('fr'))
register('it', loader('it'))
register('ja', loader('ja'))
register('pt', loader('pt'))
register('ro', loader('ro'))
register('ru', loader('ru'))
register('zhs', loader('zhs'))

// Initialize FormatJS
init({
  fallbackLocale: 'en',
  initialLocale: getLocaleFromNavigator(),
})
