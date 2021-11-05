/**
 * Gmail content script.
 *
 * @module
 */

import { debug } from 'debug'
import { Design } from './design'
import { Webmail, Selectors } from './webmail'

/** Selectors for interesting HTML Elements of Gmail. */
const selectors: Selectors = {
  mail: '.a3s.aiL',
  toolbar: '.J-J5-Ji.btA',
  editor: '.iN',
  editorContent: '[contenteditable]',
  send: '.T-I.J-J5-Ji.aoO.v7.T-I-atl.L3',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

const webmail = new Webmail(selectors, Design.Gmail)
webmail.observe()
