/* eslint-disable complexity */
/* eslint-disable sonarjs/cognitive-complexity */
/**
 * Zoho interface functions for content scripts.
 *
 * Zoho encrypt has different frames that can be opened at the same time, so
 * when 2 different frames for encryption are opened, we select them with an
 * specific class that consist of two of these frames plus the main window, but
 * the main windows is not inside an iframe, so we have to treat every frame and
 * its components like an object to always keep track of the corresponding
 * components like the toolbar, mail, etc...
 *
 * @module
 */
import { debug } from 'debug';
import { convert } from 'html-to-text';
import { get } from 'svelte/store';
import tippy from 'tippy.js';
import { _ } from '$/i18n';
import { ErrorMessage, ExtensionError } from '~src/error';
import { isOpenpgpEnabled } from '~src/options';
import EncryptButton from './EncryptButton.svelte';
import { Design } from './design';
import { FLAG, Webmail } from './webmail';
export class Zoho extends Webmail {
    constructor() {
        super(...arguments);
        /**
         * Handles mutations observed by the `MutationObserver` below, i.e.
         * notifications of elements added or removed from the page.
         */
        this.handleMutations = () => {
            var _a;
            const mails = document.body.querySelectorAll(this.selectors.mail);
            for (const mail of mails)
                this.handleMailElement(mail);
            const elements = document.querySelectorAll('.SCm');
            let mail;
            for (let x = 1; x < elements.length; x++) {
                if (elements[x].querySelector('iframe')) {
                    mail = elements[x];
                    if (mail === undefined)
                        return;
                    const frame = (_a = mail === null || mail === void 0 ? void 0 : mail.querySelector('iframe')) === null || _a === void 0 ? void 0 : _a.contentDocument;
                    /** Create a new MailElement */
                    const mailElement = {};
                    mailElement.editor = frame === null || frame === void 0 ? void 0 : frame.querySelector(this.selectors.editor);
                    mailElement.editorContent = frame === null || frame === void 0 ? void 0 : frame.querySelector(this.selectors.editorContent);
                    mailElement.toolbar = mail.querySelector(this.selectors.toolbar);
                    mailElement.send = mail.querySelector(this.selectors.send);
                    this.handleToolbarZoho(mailElement);
                }
            }
        };
        /** Adds an encryption button in the toolbar. */
        this.handleToolbarZoho = (mailElements) => {
            if (mailElements.toolbar === null || mailElements.toolbar === undefined)
                return;
            const node = mailElements.send;
            if (!mailElements.editor ||
                !mailElements.editorContent ||
                !mailElements.send ||
                !node)
                return;
            if (FLAG in mailElements.toolbar.dataset)
                return;
            mailElements.toolbar.dataset[FLAG] = '1';
            const target = document.createElement('span');
            target.id = 'EncryptButton';
            target.style.display = 'contents';
            const { design } = this;
            const button = new EncryptButton({
                target,
                props: { design },
            });
            node.after(target);
            const tooltip = tippy(mailElements.send, {
                theme: 'light-border',
            });
            _.subscribe(($_) => {
                tooltip.setContent($_('this-mail-is-not-encrypted'));
            });
            this.addClickListener(button, async (promise, resolved, rejected, signal) => {
                var _a;
                if (promise && !resolved && !rejected)
                    return promise;
                if (mailElements.editorContent === undefined)
                    return;
                if (((_a = mailElements.editorContent) === null || _a === void 0 ? void 0 : _a.textContent) === '')
                    throw new ExtensionError(ErrorMessage.MailContentUndefined);
                button.$set({ report: undefined });
                if (mailElements.editorContent === null)
                    return;
                let mailContent = mailElements.editorContent.innerHTML;
                if (!get(isOpenpgpEnabled))
                    mailContent = convert(mailContent, { wordwrap: 130 });
                // Encrypt and replace
                let encryptedString = await this.encryptString(
                // Use innerHTML instead of textContent to support rich text
                mailContent, (report) => {
                    button.$set({ report });
                }, signal);
                encryptedString += '\r';
                mailElements.editorContent.innerHTML = '';
                const pre = document.createElement('pre');
                if (encryptedString.startsWith('AAAAF')) {
                    pre.append(encryptedString);
                }
                else {
                    // For some reason zoho messages needs to be in the following format to be able to detect
                    // injected text like our encrypted string
                    // part message 1<br>
                    // part message 2<br> etc...
                    let position;
                    let aux = encryptedString;
                    /**
                     * The way I do it it always remains one \n at the end to the final
                     * length is going to be 1
                     */
                    while (encryptedString.length !== 1) {
                        position = encryptedString.indexOf('\n');
                        aux = encryptedString.slice(0, position);
                        encryptedString = encryptedString.slice(position + 1, encryptedString.length);
                        const br = document.createElement('br');
                        pre.append(aux);
                        pre.append(br);
                    }
                }
                mailElements.editorContent.append(pre);
                const event = new InputEvent('input', { bubbles: true });
                mailElements.editorContent.dispatchEvent(event);
                tooltip.destroy();
            });
        };
    }
}
/** Selectors for interesting HTML Elements of Zoho. */
export const selectors = {
    mail: '.jsConTent > div:nth-child(1) > div:nth-child(1) > pre:nth-child(1)',
    toolbar: '.SCmb',
    editor: '.ze_body.spellCheckOn',
    editorContent: '[contenteditable]',
    send: '.SCtxt.SCBtn',
    encryptButtonSibling: '.SCtxt.SCBtn',
};
// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production')
    debug.enable('*');
const webmail = new Zoho(selectors, Design.Zoho);
webmail.observe();
//# sourceMappingURL=zoho.js.map