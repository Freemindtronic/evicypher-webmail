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
  mail: '.XbIp4',
  toolbar: '.R6yXY',
  editor: '.dMm6A',
  editorContent: '.dFCbN',
  send: '.ms-Button--primary',
  encryptButtonSibling: '.OTADH > div:nth-child(1)',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

const webmail = new Webmail(selectors, Design.Outlook)
webmail.observe()
