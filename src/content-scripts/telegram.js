/**
 * Telegram functions for content scripts.
 *
 * It works in the same way as most simple web mails.
 *
 * @module
 */
import { debug } from 'debug';
import { Design } from './design';
import { Webmail } from './webmail';
/** Selectors for interesting HTML Elements of Gmail. */
export const selectors = {
    mail: '.message',
    toolbar: '.chat-input',
    editor: '.chat-input',
    editorContent: '.input-message-input.scrollable.scrollable-y.i18n.no-scrollbar',
    send: '.btn-icon.tgico-none.btn-circle.z-depth-1.btn-send.animated-button-icon.rp',
    encryptButtonSibling: '.btn-icon.tgico-none.toggle-emoticons',
};
// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production')
    debug.enable('*');
export const webmail = new Webmail(selectors, Design.Telegram);
webmail.observe();
//# sourceMappingURL=telegram.js.map