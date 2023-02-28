/* eslint-disable complexity */
/**
 * Proton content script.
 *
 * @module
 */
import { debug } from 'debug';
import { convert } from 'html-to-text';
import { get } from 'svelte/store';
import tippy from 'tippy.js';
import { ErrorMessage, ExtensionError } from '$/error';
import { _ } from '$/i18n';
import { isOpenpgpEnabled } from '~src/options';
import { Design } from './design';
import { Mail } from './mail';
import { FLAG, Webmail } from './webmail';
class Proton extends Webmail {
    constructor() {
        super(...arguments);
        /** Adds a button to a given element to decrypt all encrypted parts found. */
        this.handleMailElement = (mailElement) => {
            var _a;
            // Mark the element
            if (FLAG in mailElement.dataset)
                return;
            mailElement.dataset[FLAG] = '1';
            // If it's not an encrypted mail, ignore it
            const mailString = mailElement.textContent;
            if (!mailString || !this.containsEncryptedText(mailString))
                return;
            // Find all encrypted parts
            const treeWalker = document.createTreeWalker(mailElement, NodeFilter.SHOW_TEXT, {
                acceptNode: (textNode) => this.isEncryptedText(textNode.data)
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_SKIP,
            });
            let node;
            while ((node = treeWalker.nextNode())) {
                if (!((_a = node.parentNode) === null || _a === void 0 ? void 0 : _a.textContent))
                    continue;
                // Add a "Decrypt" button next to the node
                const encryptedString = this.extractEncryptedString(node.parentNode.textContent);
                const workspace = this.initInjectionTarget(node);
                this.addDecryptButton(workspace, encryptedString);
                if (!get(isOpenpgpEnabled))
                    this.addQRDecryptButton(workspace, encryptedString);
            }
        };
        /**
         * Handles mutations observed by the `MutationObserver` below, i.e.
         * notifications of elements added or removed from the page.
         */
        this.handleMutations = () => {
            // The user opens a mail
            // The selector is different depending if it is Legacy or PGP
            this.selectors.mail = get(isOpenpgpEnabled)
                ? '.message-content > :first-child'
                : '#proton-root';
            const pre = document.querySelector('pre.m0');
            if (!pre)
                this.selectors.mail = '#proton-root';
            const mails = document.body.querySelectorAll(this.selectors.mail);
            for (const mail of mails)
                this.handleMailElement(mail);
            // The user starts writing a mail
            const toolbars = document.body.querySelectorAll(this.selectors.toolbar);
            for (const toolbar of toolbars)
                this.handleToolbar(toolbar);
        };
    }
    /** Adds an encryption button in the toolbar. */
    // eslint-disable-next-line sonarjs/cognitive-complexity
    handleToolbar(toolbar) {
        var _a;
        // Proton mail has 2 different decrypt panels, one with an iframe and the other one doesn't have an iframe
        // so it checks if it has more than 1 iframe, if it does then the encrypted mail is in the iframe if not it is not.
        const editor = document.querySelectorAll('iframe').length > 1
            ? document.querySelectorAll('iframe')[1]
            : document.querySelectorAll('iframe')[0];
        const mailSelector = (_a = editor === null || editor === void 0 ? void 0 : editor.contentDocument) === null || _a === void 0 ? void 0 : _a.querySelector(selectors.editorContent);
        const footer = document.querySelector('footer');
        const sendButton = footer === null || footer === void 0 ? void 0 : footer.querySelector('button');
        const node = this.encryptButtonSibling(selectors, toolbar, editor);
        if (!editor || !mailSelector || !sendButton || !node)
            return;
        const mail = new Mail(mailSelector);
        if (FLAG in toolbar.dataset)
            return;
        toolbar.dataset[FLAG] = '1';
        const tooltip = tippy(sendButton, {
            theme: 'light-border',
        });
        _.subscribe(($_) => {
            tooltip.setContent($_('this-mail-is-not-encrypted'));
        });
        const button = this.addEncryptButton(node);
        this.addClickListener(button, async (promise, resolved, rejected, signal) => {
            if (promise && !resolved && !rejected)
                return promise;
            if (mail.isEmpty())
                throw new ExtensionError(ErrorMessage.MailContentUndefined);
            button.$set({ report: undefined });
            let mailContent = mail.getContent();
            if (!get(isOpenpgpEnabled))
                mailContent = convert(mailContent, { wordwrap: 130 });
            // Encrypt and replace
            let encryptedString = await this.encryptString(mailContent, (report) => {
                button.$set({ report });
            }, signal);
            // Adding \r at the end solves the multiple responses problem
            encryptedString += '\r';
            mail.setContent(encryptedString);
            tooltip.destroy();
        });
    }
}
/** Selectors for interesting HTML Elements of Proton. */
const selectors = {
    // The selector is different depending if it is Legacy or PGP
    mail: '.m0',
    toolbar: '.composer-actions',
    // Selectors below are not used because CSS selectors cannot get through iframe
    editor: '.',
    editorContent: '[contenteditable]',
    send: '.',
};
// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production')
    debug.enable('*');
const webmail = new Proton(selectors, Design.Proton);
webmail.observe();
//# sourceMappingURL=proton.js.map