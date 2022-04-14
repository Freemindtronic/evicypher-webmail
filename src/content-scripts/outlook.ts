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
  mail: '.fEEQbbifEC8quzJXH0sd.BeMjeoOEu2wdPEQukh37.TiApUvaZOn0aLkSUHRf7.allowTextSelection',
  toolbar: '.YpZyYK8i3DgEDF41WBg9',
  editor: '#ReadingPaneContainerId',
  editorContent: '[contenteditable]',
  send: '.ms-Button--primary',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

const webmail = new Webmail(selectors, Design.Outlook)
webmail.observe()
