import { BrowserStore } from 'browser-store'
import { addMessages, getLocaleFromNavigator, init, locale } from 'svelte-i18n'
import { browser } from 'webextension-polyfill-ts'
import en from '/locales/en/strings.json'
import fr from '/locales/fr/strings.json'

addMessages('en', en)
addMessages('fr', fr)

init({
  fallbackLocale: 'en',
  initialLocale: getLocaleFromNavigator(),
})

const storedLocale = new BrowserStore('locale', locale, {
  storage: browser.storage.local, // TODO: move to storage.sync
})

export { storedLocale as locale }
