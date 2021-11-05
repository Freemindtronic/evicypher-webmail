/**
 * WhatsApp functions for content scripts.
 *
 * @module
 */

import { debug } from 'debug'
import { Design } from './design'
import { Webmail, Selectors } from './webmail'

/** Selectors for interesting HTML Elements of Gmail. */
const selectors: Selectors = {
  mail: '.message-out, .message-in',
  toolbar: '._1SEwr',
  editor: '._1SEwr',
  send: '._3HQNh._1Ae7k',
  editorContent: '._13NKt.copyable-text.selectable-text[spellcheck="true"]',
  encryptButtonSibling: '._2jitM',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

const webmail = new Webmail(selectors, Design.WhatsApp)
webmail.observe()
