/**
 * Extension options
 *
 * Contains all the options of the extension
 *
 * @module
 */

import { writable } from 'svelte/store'
import { BrowserStore } from '$/browser-store'

/** Store either to use OpenPGP or Legacy encryption */
export const isOpenpgpEnabled: BrowserStore<boolean> = new BrowserStore(
  'openpgpEnabled',
  writable(false)
)

/** Store either to use BITB or not */
export const isBITBEnabled: BrowserStore<boolean> = new BrowserStore(
  'bitbEnabled',
  writable(true)
)
