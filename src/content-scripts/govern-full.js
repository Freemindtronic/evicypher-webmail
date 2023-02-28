/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable complexity */
/**
 * Govern Andorra Full mode interface functions for content scripts.
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
import EncryptButton from './EncryptButton.svelte';
import { Design } from './design';
import { FLAG, Webmail } from './webmail';
class GovernFull extends Webmail {
    constructor() {
        super(...arguments);
        /** Observes the DOM for changes. Should work for most webmails. */
        this.observe = () => {
            // Run the listener on page load
            this.handleMutations();
            // Start observing the DOM for changes
            new MutationObserver(() => {
                this.handleMutations();
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            }).observe(document.querySelector('frame').contentDocument, {
                subtree: true,
                childList: true,
            });
        };
        /**
         * Handles mutations observed by the `MutationObserver` below, i.e.
         * notifications of elements added or removed from the page.
         */
        this.handleMutations = () => {
            var _a, _b;
            // The user opens a mail
            const frame1 = document.querySelectorAll('frame')[0];
            const mails = (_a = frame1 === null || frame1 === void 0 ? void 0 : frame1.contentDocument) === null || _a === void 0 ? void 0 : _a.querySelectorAll(this.selectors.mail);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            for (const mail of mails) {
                let iframe;
                // We check if the content of the mail is embedded in an iframe
                if (mail.children[0].tagName === 'IFRAME') {
                    iframe = mail.children[0];
                    // Verify that the iframe is loaded
                    iframe.addEventListener('load', () => {
                        this.handleMailElementGov(mail, iframe);
                    });
                }
                else {
                    iframe = undefined;
                    this.handleMailElementGov(mail, iframe);
                }
            }
            // The user starts writing a mail
            const toolbars = (_b = frame1.contentDocument) === null || _b === void 0 ? void 0 : _b.querySelectorAll(this.selectors.toolbar);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            for (const toolbar of toolbars) {
                setTimeout(() => {
                    this.handleToolbar(toolbar);
                }, 1000);
            }
        };
        /** Adds a button to a given element to decrypt all encrypted parts found. */
        this.handleMailElement = (mailElement) => {
            var _a;
            // I get the innerText because i need the br tags to be rendered
            // eslint-disable-next-line unicorn/prefer-dom-node-text-content
            const mailStringInnerText = mailElement.innerText;
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
                if (get(isOpenpgpEnabled))
                    this.addDecryptButton(workspace, mailStringInnerText);
                else
                    this.addDecryptButton(workspace, encryptedString);
                if (!get(isOpenpgpEnabled))
                    this.addQRDecryptButton(workspace, encryptedString);
            }
        };
        /** Adds an encryption button in the toolbar. */
        this.handleToolbar = (toolbar) => {
            var _a, _b, _c;
            const editor = (_b = (_a = document
                .querySelector('frame')) === null || _a === void 0 ? void 0 : _a.contentDocument) === null || _b === void 0 ? void 0 : _b.querySelector('#e-contentpanel-container');
            const frame = (_c = document.querySelector('frame')) === null || _c === void 0 ? void 0 : _c.contentDocument;
            if (!frame)
                return;
            const iframe = frame === null || frame === void 0 ? void 0 : frame.querySelectorAll('iframe[id$=editorframe]');
            if (!iframe)
                return;
            const sendButton = frame.querySelector('#e-actions-mailedit-send-text');
            const node = frame.querySelectorAll('iframe[id$=editorframe]');
            if (!editor || !sendButton || !node)
                return;
            toolbar.dataset[FLAG] = '1';
            const target = document.createElement('span');
            target.id = 'spanEncryptButton';
            target.style.display = 'contents';
            const { design } = this;
            const button = new EncryptButton({
                target,
                props: { design },
            });
            // Loop to put the button in the iframe that does not have and has been opened
            // node is the collection of iframe
            for (const leaf of node) {
                if (!leaf.previousSibling) {
                    let iframeID = leaf.id.match(/\d/g);
                    iframeID = iframeID === null || iframeID === void 0 ? void 0 : iframeID.join('');
                    target.id += iframeID;
                    leaf.before(target);
                    const tooltip = tippy(sendButton, {
                        theme: 'light-border',
                    });
                    _.subscribe(($_) => {
                        tooltip.setContent($_('this-mail-is-not-encrypted'));
                    });
                    this.addClickListener(button, async (promise, resolved, rejected, signal) => {
                        var _a;
                        const mailAux = frame === null || frame === void 0 ? void 0 : frame.querySelector(
                        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                        `#e-\\$new-${iframeID}-bodyrich-editorframe`);
                        const mail = (_a = mailAux === null || mailAux === void 0 ? void 0 : mailAux.contentDocument) === null || _a === void 0 ? void 0 : _a.body;
                        if (mail === undefined)
                            return;
                        if (promise && !resolved && !rejected)
                            return promise;
                        if (!mail.textContent)
                            throw new ExtensionError(ErrorMessage.MailContentUndefined);
                        button.$set({ report: undefined });
                        let mailContent = mail.innerHTML;
                        if (!get(isOpenpgpEnabled))
                            mailContent = convert(mailContent, { wordwrap: 130 });
                        // Encrypt and replace
                        let encryptedString = await this.encryptString(
                        // Use value of textarea
                        mailContent, (report) => {
                            button.$set({ report });
                        }, signal);
                        // Clear the textContent because i want it empty for the next steps
                        mail.textContent = '';
                        const pre = document.createElement('pre');
                        // Adding \r at the end solves the multiple responses problem
                        encryptedString += '\r';
                        pre.append(encryptedString);
                        mail.append(pre);
                        tooltip.destroy();
                        if (!get(isOpenpgpEnabled))
                            mail.textContent = encryptedString;
                    });
                }
            }
        };
    }
    handleMailElementGov(mailElement, iframe) {
        var _a;
        // Mark the element
        if (mailElement === undefined)
            return;
        if (FLAG in mailElement.dataset)
            return;
        mailElement.dataset[FLAG] = '1';
        // We enter the body of the iframe to retrieve the text
        if (iframe)
            mailElement = (_a = iframe.contentDocument) === null || _a === void 0 ? void 0 : _a.body;
        if (mailElement === undefined)
            return;
        this.handleMailElement(mailElement);
    }
}
/** Selectors for interesting HTML Elements of GovernAndorra. */
const selectors = {
    mail: '.s-mailbody, .s-mailbody-preview',
    toolbar: '#e-toolbar',
    editor: '',
    editorContent: '',
    send: '',
};
/**
 * Function that injects the styles for the button to appear with all the styles
 * I do this because the actual system has an error trying to fetch the source
 * Of the styles
 *
 * @remarks
 *   This a workaround of a bug of svelte that inject the css of an app in an
 *   unaccessible head if the app is in an frame
 */
const injectCSS = (function () {
    return function () {
        var _a, _b;
        // Entire css to be injected
        // !! NEEDS TO BE CHANGED, BECAUSE ITS VERY TEDIOUS IF YOU WANT TO PERFORM A CHANGE IN THE STYLES
        const css = ".tippy-box[data-theme~=light-border]{background-color:#fff;background-clip:padding-box;border:1px solid rgba(0,8,16,.15);color:#333;box-shadow:0 4px 14px -2px rgba(0,8,16,.08)}.tippy-box[data-theme~=light-border]>.tippy-backdrop{background-color:#fff}.tippy-box[data-theme~=light-border]>.tippy-arrow:after,.tippy-box[data-theme~=light-border]>.tippy-svg-arrow:after{content:'';position:absolute;z-index:-1}.tippy-box[data-theme~=light-border]>.tippy-arrow:after{border-color:transparent;border-style:solid}.tippy-box[data-theme~=light-border][data-placement^=top]>.tippy-arrow:before{border-top-color:#fff}.tippy-box[data-theme~=light-border][data-placement^=top]>.tippy-arrow:after{border-top-color:rgba(0,8,16,.2);border-width:7px 7px 0;top:17px;left:1px}.tippy-box[data-theme~=light-border][data-placement^=top]>.tippy-svg-arrow>svg{top:16px}.tippy-box[data-theme~=light-border][data-placement^=top]>.tippy-svg-arrow:after{top:17px}.tippy-box[data-theme~=light-border][data-placement^=bottom]>.tippy-arrow:before{border-bottom-color:#fff;bottom:16px}.tippy-box[data-theme~=light-border][data-placement^=bottom]>.tippy-arrow:after{border-bottom-color:rgba(0,8,16,.2);border-width:0 7px 7px;bottom:17px;left:1px}.tippy-box[data-theme~=light-border][data-placement^=bottom]>.tippy-svg-arrow>svg{bottom:16px}.tippy-box[data-theme~=light-border][data-placement^=bottom]>.tippy-svg-arrow:after{bottom:17px}.tippy-box[data-theme~=light-border][data-placement^=left]>.tippy-arrow:before{border-left-color:#fff}.tippy-box[data-theme~=light-border][data-placement^=left]>.tippy-arrow:after{border-left-color:rgba(0,8,16,.2);border-width:7px 0 7px 7px;left:17px;top:1px}.tippy-box[data-theme~=light-border][data-placement^=left]>.tippy-svg-arrow>svg{left:11px}.tippy-box[data-theme~=light-border][data-placement^=left]>.tippy-svg-arrow:after{left:12px}.tippy-box[data-theme~=light-border][data-placement^=right]>.tippy-arrow:before{border-right-color:#fff;right:16px}.tippy-box[data-theme~=light-border][data-placement^=right]>.tippy-arrow:after{border-width:7px 7px 7px 0;right:17px;top:1px;border-right-color:rgba(0,8,16,.2)}.tippy-box[data-theme~=light-border][data-placement^=right]>.tippy-svg-arrow>svg{right:11px}.tippy-box[data-theme~=light-border][data-placement^=right]>.tippy-svg-arrow:after{right:12px}.tippy-box[data-theme~=light-border]>.tippy-svg-arrow{fill:#fff}.tippy-box[data-theme~=light-border]>.tippy-svg-arrow:after{background-image:url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCA2czEuNzk2LS4wMTMgNC42Ny0zLjYxNUM1Ljg1MS45IDYuOTMuMDA2IDggMGMxLjA3LS4wMDYgMi4xNDguODg3IDMuMzQzIDIuMzg1QzE0LjIzMyA2LjAwNSAxNiA2IDE2IDZIMHoiIGZpbGw9InJnYmEoMCwgOCwgMTYsIDAuMikiLz48L3N2Zz4=);background-size:16px 6px;width:16px;height:6px}.tippy-box[data-animation=fade][data-state=hidden]{opacity:0}[data-tippy-root]{max-width:calc(100vw - 10px)}.tippy-box{position:relative;background-color:#333;color:#fff;border-radius:4px;font-size:14px;line-height:1.4;outline:0;transition-property:transform,visibility,opacity}.tippy-box[data-placement^=top]>.tippy-arrow{bottom:0}.tippy-box[data-placement^=top]>.tippy-arrow:before{bottom:-7px;left:0;border-width:8px 8px 0;border-top-color:initial;transform-origin:center top}.tippy-box[data-placement^=bottom]>.tippy-arrow{top:0}.tippy-box[data-placement^=bottom]>.tippy-arrow:before{top:-7px;left:0;border-width:0 8px 8px;border-bottom-color:initial;transform-origin:center bottom}.tippy-box[data-placement^=left]>.tippy-arrow{right:0}.tippy-box[data-placement^=left]>.tippy-arrow:before{border-width:8px 0 8px 8px;border-left-color:initial;right:-7px;transform-origin:center left}.tippy-box[data-placement^=right]>.tippy-arrow{left:0}.tippy-box[data-placement^=right]>.tippy-arrow:before{left:-7px;border-width:8px 8px 8px 0;border-right-color:initial;transform-origin:center right}.tippy-box[data-inertia][data-state=visible]{transition-timing-function:cubic-bezier(.54,1.5,.38,1.11)}.tippy-arrow{width:16px;height:16px;color:#333}.tippy-arrow:before{content:'';position:absolute;border-color:transparent;border-style:solid}.tippy-content{position:relative;padding:5px 9px;z-index:1}:global{@import '../assets/tippy';}.button {all: revert;:global(svg),:global(img) {vertical-align: bottom;}}.button.governandorra {margin: 8px 0;margin-right: 10px;padding: 4 7px;color: #000000;font-size: 12px;font-family: 'Helvetica, Arial', 'Segoe UI Semibold', 'Segoe WP Semibold','Segoe UI', 'Segoe WP', Tahoma, Arial, sans-serif;line-height: 2;background: rgba(0, 0, 0, 0) linear-gradient(rgb(249, 249, 249) 0%, rgb(226, 226, 226) 100%) repeat scroll 0% 0%;border: 1px solid rgb(200, 200, 200);border-radius: 0;cursor: pointer;&:focus {border-color: #bccad7;}&:hover {background-color: #bccad7;border-color: #39577a;}&.decrypt {margin: 8px 0;}&.encrypt {margin: 8px 0;float: left;} > :global(svg) {vertical-align: middle;}}svg {-webkit-transform: translateY(20%);}.tooltip {all: unset;display: flex;gap: 0.5em;align-items: center;width: max-content;max-width: 100%;font-family: system-ui, -apple-system, 'Segoe UI', 'Roboto', 'Ubuntu','Cantarell', 'Noto Sans', sans-serif;white-space: pre-line;> :global(button){flex-shrink: 0;}}";
        // Search for the iframe head to put the style we want
        const head = (_b = (_a = document
            .querySelector('frame')) === null || _a === void 0 ? void 0 : _a.contentDocument) === null || _b === void 0 ? void 0 : _b.getElementsByTagName('head')[0];
        // Create a new element of style to put the css strings declared before
        const style = document.createElement('style');
        // Put the style element in the head of the iframe
        head === null || head === void 0 ? void 0 : head.appendChild(style);
        // Put type of style to be a text/css type content
        style.type = 'text/css';
        // Finally I append the string css to the style of the head that we already put before
        // eslint-disable-next-line unicorn/prefer-dom-node-append
        style.appendChild(document.createTextNode(css));
    };
})();
// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production')
    debug.enable('*');
setTimeout(() => {
    // Injects the string CSS in the iframe head style part of goverandorra-full
    injectCSS();
    const webmail = new GovernFull(selectors, Design.GovernAndorra);
    webmail.observe();
}, 1000);
//# sourceMappingURL=govern-full.js.map