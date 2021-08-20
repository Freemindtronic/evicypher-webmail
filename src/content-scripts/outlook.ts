/**
 * Outlook content script.
 *
 * @module
 */

import { debug } from 'debug'
import { observe } from './common'

/** Selectors for interesting HTML Elements of Outlook. */
const selectors = {
  MAIL_CONTENT: '.QMubUjbS-BOly_BTHEZj7',
  TOOLBAR: '._2ELnTBajF7jzj_m_hoj3Xt',
  MAIL_EDITOR: '._17WvdmDfhREFqBNvlLv75X',
  EDITOR_CONTENT: '[contenteditable]',
  SEND_BUTTON: '.css-373',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

observe({ selectors, design: 'outlook' })
