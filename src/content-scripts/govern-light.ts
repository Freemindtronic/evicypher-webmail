/**
 * Light Andorra Government functions for content scripts.
 *
 * The govern andorra webmail is compose of 2 UI. One light and one heavy. The
 * light one is the easier of the 2 and works as other webmail.
 *
 * The only drawback compared to the other webmails, is that the JS was executed
 * before the page was loaded so it was not possible to inject the buttons correctly.
 *
 * Solution: Put a setTimeout to the {@link observe} function.
 *
 * @module
 */

import { debug } from 'debug'
import { Design } from './design'
import { Webmail, Selectors } from './webmail'

/** Selectors for interesting HTML Elements of Govern Andorra - Ultra Light. */
export const selectors: Selectors = {
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
  const webmail = new Webmail(selectors, Design.GovernAndorra)
  webmail.observe()
}, 500)
