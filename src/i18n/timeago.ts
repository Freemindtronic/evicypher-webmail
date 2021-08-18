/**
 * Wrapper around
 * [javascript-time-ago](https://github.com/catamphetamine/javascript-time-ago).
 *
 * @remarks
 *   This module has side-effects: importing it will fetch the locale files.
 * @module
 */

import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import fr from 'javascript-time-ago/locale/fr'
import { derived } from 'svelte/store'
import { locale } from '.'

// Initialize TimeAgo
TimeAgo.addDefaultLocale(en)
TimeAgo.addLocale(fr)

/**
 * Formats a date into an "x minutes ago" string.
 *
 * @remarks
 *   This is a Svelte store, it needs to be used with a `$` symbol beforehand:
 *   `$timeago(Date.now())`.
 */
export const timeago = derived(locale, ($locale) => {
  const instance = new TimeAgo($locale)
  return (date: number, now?: number) =>
    // @ts-expect-error @types/javascript-time-ago is not up to date
    instance.format(date, 'round-minute', { now })
})
