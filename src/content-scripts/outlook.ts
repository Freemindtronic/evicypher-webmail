/**
 * Outlook content script.
 *
 * @module
 */

import { debug } from 'debug'
import { Design } from './design'
import { Webmail, Selectors } from './webmail'

/** Selectors for interesting HTML Elements of Outlook. */
const selectors: Selectors = {
  mail: '.QMubUjbS-BOly_BTHEZj7',
  toolbar: '._2ELnTBajF7jzj_m_hoj3Xt',
  editor: '._17WvdmDfhREFqBNvlLv75X',
  editorContent: '[contenteditable]',
  send: '.ms-Button--primary',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

const webmail = new Webmail(selectors, Design.Outlook)
webmail.observe()
