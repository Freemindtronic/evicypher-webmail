import { BrowserStore } from 'browser-store'
import { addMessages, getLocaleFromNavigator, init, locale } from 'svelte-i18n'
import { browser } from 'webextension-polyfill-ts'
import en from '~/locales/en/strings.json'
import fr from '~/locales/fr/strings.json'

// Register languages
addMessages('en', en)
addMessages('fr', fr)

// Initialize FormatJS
init({
  fallbackLocale: 'en',
  initialLocale: getLocaleFromNavigator(),
})

/** Application locale. */
const storedLocale = new BrowserStore<string>('locale', locale, {
  storage: browser.storage.sync,
})

export { storedLocale as locale }
