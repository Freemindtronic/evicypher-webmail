/**
 * Gmail content script.
 *
 * @module
 */

import { debug } from 'debug'
import { observe } from './common'

/** Selectors for interesting HTML Elements of Gmail. */
const selectors = {
  MAIL_CONTENT: '.a3s.aiL',
  TOOLBAR: '.J-J5-Ji.btA',
  MAIL_EDITOR: '.iN',
  EDITOR_CONTENT: '[contenteditable]',
  SEND_BUTTON: '.T-I.J-J5-Ji.aoO.v7.T-I-atl.L3',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

observe({ selectors, design: 'gmail' })
