/**
 * Yahoo content script.
 *
 * @module
 */

import { debug } from 'debug'
import { Design } from './design'
import { Webmail, Selectors } from './webmail'

/** Selectors for interesting HTML Elements of Yahoo. */
const selectors: Selectors = {
  mail: '.msg-body',
  toolbar: '.z_Z14vXdP',
  editor: '.em_N.D_F.ek_BB.p_R.o_h',
  editorContent: '[contenteditable]',
  send: '.q_Z29WjXl',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

const webmail = new Webmail(selectors, Design.Yahoo)
webmail.observe()
