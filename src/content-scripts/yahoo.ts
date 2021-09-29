/**
 * Yahoo content script.
 *
 * @module
 */

import { debug } from 'debug'
import { observe, Selectors } from './common'
import { Design } from './design'

/** Selectors for interesting HTML Elements of Yahoo. */
const selectors: Selectors = {
  mail: '.I_52qC.D_FY.W_6D6F',
  toolbar: '.z_Z14vXdP.D_F.ab_C.I_52qC.W_6D6F.p_R.B_0',
  editor: '.em_N.D_F.ek_BB.p_R.o_h',
  editorContent: '[contenteditable]',
  send: '.q_Z2aVTcY.e_dRA.k_w.r_P',
  encryptButtonSibling: '.q_Z2aVTcY.e_dRA.k_w.r_P',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

observe({ selectors, design: Design.Yahoo })
