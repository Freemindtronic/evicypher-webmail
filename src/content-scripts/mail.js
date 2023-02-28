/**
 * Mail class representation
 *
 * Allow easier manipulation of compose mail element
 *
 * @class
 */
export class Mail {
    constructor(selector) {
        this.selector = selector;
        this.isTextArea = selector.localName === 'textarea';
    }
    /** Return if the mail is empty */
    isEmpty() {
        if (this.isTextArea)
            return this.selector.value === '';
        return !this.selector.textContent;
    }
    /** Get the content of the mail */
    getContent() {
        if (this.isTextArea) {
            // Convert text to html to make line return visible when decrypting
            return this.selector.value.replaceAll('\n', '<br>');
        }
        return this.selector.innerHTML;
    }
    /** Set the content of the mail */
    setContent(text) {
        if (this.isTextArea) {
            ;
            this.selector.value = text;
            return;
        }
        // Place the text in a preformatted text element
        const pre = document.createElement('pre');
        pre.append(text);
        this.selector.innerHTML = '';
        this.selector.append(pre);
        // Declare changes to page scripts
        const event = new InputEvent('input', { bubbles: true });
        this.selector.dispatchEvent(event);
    }
}
//# sourceMappingURL=mail.js.map