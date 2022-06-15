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
  mail: '.fEEQb',
  toolbar: '.YpZyY',
  editor: '#ReadingPaneContainerId',
  editorContent: '[contenteditable]',
  send: '.ms-Button--primary',
  encryptButtonSibling: '.ms-Button--default',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

const webmail = new Webmail(selectors, Design.Outlook)
webmail.observe()
