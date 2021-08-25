/**
 * Ovh content script.
 *
 * @module
 */

import { debug } from 'debug'
import { observe, Selectors } from './common'
import { Design } from './design'

/** Selectors for interesting HTML Elements of Outlook. */
const selectors: Selectors = {
  mail: '._rp_45',
  toolbar: '._mcp_H2',
  editor: '._mcp_e1.ms-bg-color-white',
  editorContent: '[contenteditable]',
  send: '._mcp_62.o365button.o365buttonOutlined.ms-font-m.ms-fwt-sb.ms-fcl-w.ms-bgc-tp.ms-bcl-tp.ms-bgc-td-f.ms-bcl-tdr-f',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

observe({ selectors, design: Design.Outlook })
