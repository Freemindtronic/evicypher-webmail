import { BrowserStore } from 'browser-store'
import { ErrorMessage } from 'error'
import { Report, State } from 'report'
import {
  addMessages,
  getLocaleFromNavigator,
  init,
  locale,
  _,
} from 'svelte-i18n'
import { derived } from 'svelte/store'
import { browser } from 'webextension-polyfill-ts'
import en from '~/locales/en/strings.json'
import fr from '~/locales/fr/strings.json'

import TimeAgo from 'javascript-time-ago'
import agoEn from 'javascript-time-ago/locale/en'
import agoFr from 'javascript-time-ago/locale/fr'

TimeAgo.addDefaultLocale(agoEn)
TimeAgo.addLocale(agoFr)

export const timeago = derived(locale, ($locale) => {
  const timeAgo = new TimeAgo($locale)
  return (date: number, now?: number) =>
    // @ts-expect-error @types/javascript-time-ago is not up to date
    timeAgo.format(date, 'round-minute', { now })
})

/** Application locale. */
const storedLocale = new BrowserStore<string>('locale', locale, {
  storage: browser.storage.sync,
})

export { storedLocale as locale }

// eslint-disable-next-line complexity
export const translateError = derived(_, ($_) => (error: ErrorMessage) => {
  switch (error) {
    case ErrorMessage.CANCELED_BY_USER:
      return $_('canceled-by-user')

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

    case ErrorMessage.TOO_MANY_ATTEMPTS:
      return $_('too-many-attempts')

    case ErrorMessage.UNKNOWN_ERROR:
      return $_('unknown-error')

    case ErrorMessage.WRONG_KEY:
      return $_('wrong-key')

    case ErrorMessage.ZEROCONF_UNAVAILABLE:
      return $_('zeroconf-unavailable')

    default:
      throw new Error(`Unknown error message: ${error as string}.`)
  }
})

export { translateError as _e }

export const translateReport = derived(_, ($_) => (report: Report) => {
  switch (report.state) {
    case State.NOTIFICATION_SENT:
      return $_('notification-sent')

    case State.WAITING_FOR_PHONE:
      return $_('waiting-for-phone')

    case State.WAITING_FOR_FIRST_RESPONSE:
      return $_('waiting-for-first-response')

    case State.TASK_IN_PROGRESS:
      return $_('task-in-progress', {
        values: { progress: report.progress },
      })

    default:
      throw new Error(`Unknown error message: ${report.state as string}.`)
  }
})

export { translateReport as _r }

// Register languages
addMessages('en', en)
addMessages('fr', fr)

// Initialize FormatJS
init({
  fallbackLocale: 'en',
  initialLocale: getLocaleFromNavigator(),
})
