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
  send: '.q_Z2aVTcY.e_dRA.k_w.r_P.H_6VdP.s_3mS2U.en_0.M_1gLo4F.V_M.cZ1RN91d_n.y_Z2hYGcu.A_6EqO.u_e69.b_0.C_52qC.I4_Z29WjXl.ir3_1JO2M7.it3_dRA',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

observe({ selectors, design: Design.Yahoo })
