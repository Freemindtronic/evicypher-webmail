/**
 * ICloud interface functions for content scripts.
 *
 * In the case of iCloud, we find that the messages are placed inside an iframe.
 * The problem is that the iframe have a different domain than the main icloud domain.
 *
 * The solution we implemented is that in webmails.json, the URL we enter is the
 * URL of the iframe, so the code will be injected directly into that URL.
 *
 * @module
 */

import { debug } from 'debug'
import { Design } from './design'
import { Selectors, Webmail } from './webmail'

/**
 * Selectors for interesting HTML Elements of iCloud.
 *
 * The send button and the text area are placed in 2 different iframe, which
 * prevents us from placing the encrypt button next to the rest of the buttons.
 * The implemented solution has placed the encrypt button at the beginning of
 * the text area.
 */
export const selectors: Selectors = {
  mail: '.mail-message-defaults',
  toolbar: '.ic-dupl4g',
  editor: '.cw-pane-container',
  editorContent: '.editor-content',
  send: '.editor-content',
  encryptButtonSibling: '.editor-wrapper',
  isBefore: true,
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

setTimeout(() => {
  const webmail = new Webmail(selectors, Design.iCloud)
  webmail.observe()
}, 1000)
