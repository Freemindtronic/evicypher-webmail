/**
 * Outlook content script.
 *
 * @module
 */

import { debug } from 'debug'
import { observe, Selectors } from './common'

/** Selectors for interesting HTML Elements of Outlook. */
const selectors: Selectors = {
  mail: '.QMubUjbS-BOly_BTHEZj7',
  toolbar: '._2ELnTBajF7jzj_m_hoj3Xt',
  editor: '._17WvdmDfhREFqBNvlLv75X',
  editorContent: '[contenteditable]',
  send: '._3BlbI7rjg2J-d7fY98r7tp',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

observe({ selectors, design: 'outlook' })
