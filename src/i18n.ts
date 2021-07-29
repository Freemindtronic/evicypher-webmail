import { BrowserStore } from 'browser-store'
import { ErrorMessage } from 'error'
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

/** Application locale. */
const storedLocale = new BrowserStore<string>('locale', locale, {
  storage: browser.storage.sync,
})

export { storedLocale as locale }

export const translateError = derived(_, ($_) => (error: ErrorMessage) => {
  switch (error) {
    case ErrorMessage.CANCELLED_BY_USER:
      return $_('cancelled-by-user')

    case ErrorMessage.UNKNOWN_ERROR:
      return $_('unknown-error')

    default:
      throw new Error('Non exhaustive switch.')
  }
})

export { translateError as _e }

// Register languages
addMessages('en', en)
addMessages('fr', fr)

// Initialize FormatJS
init({
  fallbackLocale: 'en',
  initialLocale: getLocaleFromNavigator(),
})
