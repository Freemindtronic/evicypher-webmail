import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import fr from 'javascript-time-ago/locale/fr'
import { derived } from 'svelte/store'
import { locale } from '.'

// Initialize TimeAgo
TimeAgo.addDefaultLocale(en)
TimeAgo.addLocale(fr)

/** Formats a date into an "x minutes ago" string. */
export const timeago = derived(locale, ($locale) => {
  const instance = new TimeAgo($locale)
  return (date: number, now?: number) =>
    // @ts-expect-error @types/javascript-time-ago is not up to date
    instance.format(date, 'round-minute', { now })
})
