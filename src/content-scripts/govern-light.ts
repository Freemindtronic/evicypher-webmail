/**
 * Light Andorra Government functions for content scripts.
 *
 * The govern andorra webmail is compose of 2 UI. One light and one heavy. The
 * light one is the easier of the 2 and works as other webmail
 *
 * @module
 */

import { debug } from 'debug'
import { observe, Selectors } from './common'
import { Design } from './design'

/** Selectors for interesting HTML Elements of Govern Andorra - Ultra Light. */
const selectors: Selectors = {
  mail: '.msgBody',
  toolbar: '.saveCancelFooter',
  editor: '#theForm',
  editorContent: '#msgBody',
  send: '.headerButtonSave.breadCrumbText',
  encryptButtonSibling: '.memoHeaders',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

// A timeout must be set so that the observer is executed once html is loaded.
setTimeout(() => {
  observe({ selectors, design: Design.GovernAndorraLight })
}, 500)
