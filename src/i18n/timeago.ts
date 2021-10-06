/**
 * Wrapper around
 * [javascript-time-ago](https://github.com/catamphetamine/javascript-time-ago).
 *
 * @remarks
 *   This module has side-effects: importing it will fetch the locale files.
 * @module
 */

// cSpell:ignore timeago

import TimeAgo from 'javascript-time-ago'
import ara from 'javascript-time-ago/locale/ar'
import cat from 'javascript-time-ago/locale/ca'
import de from 'javascript-time-ago/locale/de'
import en from 'javascript-time-ago/locale/en'
import es from 'javascript-time-ago/locale/es'
import fr from 'javascript-time-ago/locale/fr'
import it from 'javascript-time-ago/locale/it'
import ja from 'javascript-time-ago/locale/ja'
import pt from 'javascript-time-ago/locale/pt'
import ro from 'javascript-time-ago/locale/ro'
import ru from 'javascript-time-ago/locale/ru'
import zhs from 'javascript-time-ago/locale/zh'
import { derived } from 'svelte/store'
import { locale } from '.'

// Initialize TimeAgo
TimeAgo.addLocale({ ...ara, locale: 'ara' })
TimeAgo.addLocale({ ...cat, locale: 'cat' })
TimeAgo.addLocale(de)
TimeAgo.addDefaultLocale(en)
TimeAgo.addLocale(es)
TimeAgo.addLocale(fr)
TimeAgo.addLocale(it)
TimeAgo.addLocale(ja)
TimeAgo.addLocale(pt)
TimeAgo.addLocale(ro)
TimeAgo.addLocale(ru)
TimeAgo.addLocale({ ...zhs, locale: 'zhs' })

// Some locale codes are overridden because not mapped correctly;
// for instance, the correct locale code for Catalan is "cat" because
// "ca" stands for Canada.

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
