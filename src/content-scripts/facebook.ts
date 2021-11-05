/**
 * Facebook content script.
 *
 * @module
 */

import { debug } from 'debug'
import { Design } from './design'
import { Webmail, Selectors } from './webmail'

/** Selectors for interesting HTML Elements of Facebook. */
const selectors: Selectors = {
  mail: '.oo9gr5id.ii04i59q,.ljqsnud1.ii04i59q',
  toolbar: '._1mf._1mj',
  editor: '.rj1gh0hx.buofh1pr.j83agx80.l9j0dhe7.cbu4d94t.ni8dbmo4.stjgntxs',
  editorContent: '._1mf._1mj',
  send: 'div.orhb3f3m:nth-child(2) > div:nth-child(1)',
  encryptButtonSibling:
    '.aovydwv3.j83agx80.buofh1pr.ni8dbmo4.cxgpxx05.sj5x9vvc.qio8uep8.hzruof5a.l9j0dhe7',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

const webmail = new Webmail(selectors, Design.Facebook)
webmail.observe()
