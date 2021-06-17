import { addMessages, getLocaleFromNavigator, init } from 'svelte-i18n'

import en from '/locales/en.json'
import fr from '/locales/fr.json'

addMessages('en', en)
addMessages('fr', fr)

init({
  fallbackLocale: 'en',
  initialLocale: getLocaleFromNavigator(),
})
