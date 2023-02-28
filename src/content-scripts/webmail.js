var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
import * as base85 from 'base85';
import { convert } from 'html-to-text';
import { Base64 } from 'js-base64';
import { get } from 'svelte/store';
import tippy from 'tippy.js';
import { ErrorMessage, ExtensionError } from '$/error';
import { _ } from '$/i18n';
import { isOpenpgpEnabled } from '~src/options';
import { startBackgroundTask, Task } from '~src/task';
import QRCode from '../components/QRCode.svelte';
import DecryptButton from './DecryptButton.svelte';
import EncryptButton from './EncryptButton.svelte';
import QRCodeButton from './QRCodeButton.svelte';
import { Mail } from './mail';
/** A flag to mark already processed (having buttons added) HTML elements. */
export const FLAG = 'freemindtronic';
export class Webmail {
    constructor(selectors, design) {
        /** Observes the DOM for changes. Should work for most webmails. */
        this.observe = () => {
            // Run the listener on page load
            setTimeout(() => {
                this.handleMutations();
            }, 200);
            // Start observing the DOM for changes
            new MutationObserver(() => {
                setTimeout(() => {
                    this.handleMutations();
                }, 200);
            }).observe(document.body, {
                subtree: true,
                childList: true,
            });
        };
        /** Sends a request to the background script to encrypt the given string. */
        this.encryptString = async (string, reporter, signal) => startBackgroundTask(Task.Encrypt, function () {
            return __asyncGenerator(this, arguments, function* () {
                // Suspend the foreground task until the background task asks for a string
                yield yield __await(void 0);
                yield yield __await(string);
            });
        }, {
            reporter,
            signal,
        });
        /** Sends a request to the background script to decrypt the given string. */
        this.decryptString = async (string, reporter, signal) => startBackgroundTask(Task.Decrypt, function () {
            return __asyncGenerator(this, arguments, function* () {
                // Suspend the foreground task until the background task asks for a string
                yield yield __await(void 0);
                yield yield __await(string);
            });
        }, {
            reporter,
            signal,
        });
        /** @returns Whether the given string contains a known encryption header */
        this.containsEncryptedText = (string) => {
            if (get(isOpenpgpEnabled)) {
                return (string.includes('-----BEGIN PGP MESSAGE-----') &&
                    string.includes('-----END PGP MESSAGE-----'));
            }
            return string.includes('AAAAF');
        };
        /** @returns Whether the given string is encrypted */
        this.isEncryptedText = (string) => {
            if (get(isOpenpgpEnabled))
                return string.trimStart().startsWith('-----BEGIN PGP MESSAGE-----');
            return string.trimStart().startsWith('AAAAF');
        };
        /** @returns A trimmed encrypted message */
        this.extractEncryptedString = (string) => {
            var _a, _b;
            const extracted = get(isOpenpgpEnabled)
                ? (_a = /-----BEGIN PGP MESSAGE-----.+-----END PGP MESSAGE-----/s.exec(string)) === null || _a === void 0 ? void 0 : _a[0]
                : (_b = /AAAAF\S*/s.exec(string)) === null || _b === void 0 ? void 0 : _b[0];
            if (!extracted)
                throw new Error('No encrypted string found to extract.');
            return extracted;
        };
        /**
         * Adds all the listeners necessary to make the button interactive.
         *
         * @remarks
         *   This function ensures that the state of the button is always consistent.
         */
        this.addClickListener = (button, listener) => {
            /** Abort controller, bound to a button in the tooltip. */
            let controller;
            button.$on('abort', () => {
                controller.abort();
                promise = undefined;
                button.$set({ promise });
            });
            let promise;
            let resolved = false;
            let rejected = false;
            // When the button is clicked, trigger the event listener
            button.$on('click', () => {
                if (promise === undefined)
                    controller = new AbortController();
                promise = listener(promise, resolved, rejected, controller.signal);
                button.$set({ promise });
                resolved = false;
                rejected = false;
                promise === null || promise === void 0 ? void 0 : promise.then(() => {
                    resolved = true;
                }).catch(() => {
                    rejected = true;
                });
            });
        };
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
                // Add a "Decrypt" button next to the node
                if (!((_a = node.parentNode) === null || _a === void 0 ? void 0 : _a.textContent))
                    continue;
                const encryptedString = this.extractEncryptedString(node.parentNode.textContent);
                const workspace = this.initInjectionTarget(node);
                this.addDecryptButton(workspace, encryptedString);
                if (!get(isOpenpgpEnabled))
                    this.addQRDecryptButton(workspace, encryptedString);
            }
        };
        this.initInjectionTarget = (node) => {
            const workspace = document.createElement('div');
            workspace.id = 'evicypher-workspace';
            const buttonArea = document.createElement('div');
            buttonArea.id = 'evicypher-area-button';
            const iframeArea = document.createElement('div');
            iframeArea.id = 'evicypher-area-iframe';
            workspace.append(buttonArea);
            workspace.append(iframeArea);
            node.before(workspace);
            return { buttonArea, iframeArea };
        };
        /** Adds a decryption button next to the text node given. */
        this.addDecryptButton = (workspace, encryptedString) => {
            // Add the button right before the beginning of the encrypted content
            const target = document.createElement('span');
            target.style.display = 'inline';
            target.id = 'DecryptSpan';
            const { design } = this;
            const button = new DecryptButton({
                target,
                props: { design },
            });
            workspace.buttonArea.append(target);
            /** Frame containing the decrypted mail. */
            let frame;
            this.addClickListener(button, (promise, resolved, rejected, signal) => {
                var _a;
                if (resolved) {
                    (_a = frame.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(frame);
                    return;
                }
                if (promise && !rejected)
                    return promise;
                button.$set({ report: undefined });
                // Decrypt and display
                return this.decryptString(encryptedString, (report) => {
                    button.$set({ report });
                }, signal).then((decryptedString) => {
                    frame = this.displayDecryptedMail(decryptedString, workspace.iframeArea);
                });
            });
        };
        /** Adds a QR code button next to the Decrypt Button. */
        this.addQRDecryptButton = (workspace, encryptedString) => {
            const target = document.createElement('span');
            target.style.display = 'inline';
            target.id = 'QRCodeSpan';
            const { design } = this;
            const button = new QRCodeButton({
                target,
                props: { design },
            });
            workspace.buttonArea.append(target);
            /** Frame containing the decrypted mail. */
            /**
             * Frame can be undefined because the QRCode if we want to hide it when
             * addClickListener(button, (promise, resolved, rejected) => { clicking
             * again we have to hide it/ put the value undefined if (resolved) {
             */
            let frame;
            this.addClickListener(button, (promise, _resolved, rejected) => {
                var _a;
                /**
                 * Checks if it's defined and if it is, put undefined to frame for the
                 * next time we want to click on the qr button to make it appear again
                 */
                if (frame) {
                    (_a = frame.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(frame);
                    frame = undefined;
                    return;
                }
                if (promise && !rejected)
                    return promise;
                button.$set({ report: undefined });
                let encryptedStringToDisplay = encryptedString;
                if (!get(isOpenpgpEnabled)) {
                    const rawData = Base64.toUint8Array(encryptedStringToDisplay);
                    // Re-encode data in Ascii85 for a smaller QRcode
                    encryptedStringToDisplay = base85.encode(Buffer.from(rawData), 'ascii85');
                    // Remove enclosure added by the base85 lib
                    encryptedStringToDisplay = encryptedStringToDisplay.slice(2, -2);
                }
                frame = this.displayQREncryptedMail(encryptedStringToDisplay, workspace.iframeArea);
            });
        };
        /** Returns the element to place the encryption button after. */
        this.encryptButtonSibling = ({ encryptButtonSibling }, toolbar, editor) => {
            var _a;
            return (_a = (encryptButtonSibling === undefined
                ? toolbar.lastChild
                : editor === null || editor === void 0 ? void 0 : editor.querySelector(encryptButtonSibling))) !== null && _a !== void 0 ? _a : undefined;
        };
        /** Adds a frame containing a given string. */
        this.displayDecryptedMail = (decryptedString, node) => {
            const frame = document.createElement('iframe');
            Object.assign(frame.style, {
                display: 'block',
                width: '100%',
                maxWidth: '100%',
                margin: '10px 0px',
                border: '2px solid #555',
                boxSizing: 'border-box',
                background: 'white',
            });
            node.append(frame);
            const setContent = () => {
                if (!frame.contentDocument)
                    throw new Error('Cannot change frame content.');
                // We are injecting raw HTML in a sandboxed environnement,
                // no need to sanitize it
                // eslint-disable-next-line no-unsanitized/property
                frame.contentDocument.body.innerHTML = get(isOpenpgpEnabled)
                    ? decryptedString
                    : '<pre>' + decryptedString + '</pre>';
                // Make the frame as tall as its content
                frame.height = '1';
                frame.height = `${frame.contentDocument.body.scrollHeight + 20}`;
            };
            setContent();
            // On Firefox the iframe empty itself on load so we have to fill it again
            frame.addEventListener('load', setContent);
            return frame;
        };
        /** Adds a frame containing a QRCode. */
        this.displayQREncryptedMail = (encryptedString, node) => {
            const frame = document.createElement('iframe');
            frame.id = 'iframe-qrcode';
            if (encryptedString.length > 2331) {
                let errorMsg = '';
                _.subscribe(($_) => {
                    errorMsg = $_('the-message-exceeds-the-maximum-number-of-characters-allowed');
                });
                // eslint-disable-next-line no-alert
                alert(errorMsg + '\n' + encryptedString.length.toString() + '/2331');
            }
            else {
                Object.assign(frame.style, {
                    display: 'block',
                    maxWidth: '100%',
                    margin: '10px 0px',
                    border: '2px solid #555',
                    boxSizing: 'border-box',
                    background: 'white',
                });
                node.append(frame);
                const setQrCode = () => {
                    var _a, _b;
                    if (!frame.contentDocument)
                        throw new Error('Cannot change frame content.');
                    // We create a Span inside the iframe to put the QRCode Element
                    const target = document.createElement('span');
                    target.id = 'spanQR';
                    target.style.display = 'contents';
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const qr = new QRCode({
                        target,
                        props: {
                            data: encryptedString,
                            size: 100,
                            scale: 3,
                        },
                    });
                    (_a = frame.contentWindow) === null || _a === void 0 ? void 0 : _a.document.body.append(target);
                    // We take the QRCode Height and copy it to the frame
                    const canvas = (_b = frame.contentDocument) === null || _b === void 0 ? void 0 : _b.querySelector('canvas');
                    const height = canvas === null || canvas === void 0 ? void 0 : canvas.style.height;
                    if (height === undefined)
                        return;
                    const frameHeightWidth = Number.parseInt(height, 10) + 20;
                    frame.style.height = frameHeightWidth.toString() + 'px';
                    frame.style.width = frameHeightWidth.toString() + 'px';
                };
                setQrCode();
                // On Firefox the iframe empty itself on load so we have to fill it again
                frame.addEventListener('load', setQrCode);
            }
            return frame;
        };
        /**
         * Handles mutations observed by the `MutationObserver` below, i.e.
         * notifications of elements added or removed from the page.
         */
        this.handleMutations = () => {
            // The user opens a mail
            const mails = document.body.querySelectorAll(this.selectors.mail);
            for (const mail of mails)
                this.handleMailElement(mail);
            // The user starts writing a mail
            const toolbars = document.body.querySelectorAll(this.selectors.toolbar);
            for (const toolbar of toolbars)
                this.handleToolbar(toolbar);
        };
        this.selectors = selectors;
        this.design = design;
    }
    addEncryptButton(node) {
        const target = document.createElement('span');
        target.style.display = 'contents';
        const { design, selectors } = this;
        const button = new EncryptButton({
            target,
            props: { design },
        });
        if (selectors.isBefore)
            node.before(target);
        else
            node.after(target);
        return button;
    }
    /** Adds an encryption button in the toolbar. */
    // eslint-disable-next-line sonarjs/cognitive-complexity
    handleToolbar(toolbar) {
        const editor = toolbar.closest(this.selectors.editor);
        const mailSelector = editor === null || editor === void 0 ? void 0 : editor.querySelector(this.selectors.editorContent);
        const sendButton = editor === null || editor === void 0 ? void 0 : editor.querySelector(this.selectors.send);
        const node = this.encryptButtonSibling(this.selectors, toolbar, editor);
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
            // Error message is shown if the mail is already encrypted
            if (this.containsEncryptedText(mail.getContent()))
                throw new ExtensionError(ErrorMessage.MailAlreadyEncrypted);
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
//# sourceMappingURL=webmail.js.map