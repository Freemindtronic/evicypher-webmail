/**
 * AndorraTelecom content script.
 *
 * It works in the same way as most simple web mails.
 *
 * @module
 */

import { debug } from 'debug'
import { Design } from './design'
import { Webmail, Selectors } from './webmail'

/** Selectors for interesting HTML Elements of AndorraTelecom. */
export const selectors: Selectors = {
  mail: '._rp_U4.ms-font-weight-regular.ms-font-color-neutralDark.rpHighlightAllClass.rpHighlightBodyClass > :first-child',
  toolbar: '._mcp_H2',
  editor: '._mcp_e1',
  editorContent: '[contenteditable]',
  send: '[autoid=_mcp_g]',
  encryptButtonSibling: '[autoid=_mcp_h]',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

export const webmail = new Webmail(selectors, Design.AndorraTelecom)
webmail.observe()
