/**
 * Roundcube content script.
 *
 * @module
 */
import { debug } from 'debug';
import { Design } from './design';
import { Webmail } from './webmail';
/** Selectors for interesting HTML Elements of Roundcube. */
const selectors = {
    mail: '._rp_U4 > :first-child',
    toolbar: '._mcp_H2',
    editor: '._mcp_e1',
    editorContent: '[contenteditable]',
    send: '[autoid=_mcp_g]',
    encryptButtonSibling: '[autoid=_mcp_h]',
};
// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production')
    debug.enable('*');
const webmail = new Webmail(selectors, Design.OutlookOld);
webmail.observe();
//# sourceMappingURL=roundcube.js.map