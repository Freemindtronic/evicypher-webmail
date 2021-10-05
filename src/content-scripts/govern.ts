/**
 * Govern Andorra functions for content scripts.
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
  observe({ selectors, design: Design.GovernAndorra })
}, 500)
