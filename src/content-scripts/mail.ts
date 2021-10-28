/**
 * Mail class representation
 *
 * Allow easier manipulation of compose mail element
 *
 * @class
 */

export class Mail {
  /** Element containing the email compose UI */
  selector: Element
  /** Is the selected element a text area element */
  isTextArea: boolean

  constructor(selector: Element) {
    this.selector = selector
    this.isTextArea = selector.localName === 'textarea'
  }

  /** Return if the mail is empty */
  isEmpty(): boolean {
    if (this.isTextArea)
      return (this.selector as HTMLTextAreaElement).value === ''

    return !this.selector.textContent
  }

  /** Get the content of the mail */
  getContent(): string {
    if (this.isTextArea) {
      // Convert text to html to make line return visible when decrypting
      return (this.selector as HTMLTextAreaElement).value.replaceAll(
        '\n',
        '<br>'
      )
    }

    return this.selector.innerHTML
  }

  /** Set the content of the mail */
  setContent(text: string): void {
    if (this.isTextArea) {
      ;(this.selector as HTMLTextAreaElement).value = text
      return
    }

    // Place the text in a preformatted text element
    const pre = document.createElement('pre')
    pre.append(text)
    this.selector.innerHTML = ''
    this.selector.append(pre)

    // Declare changes to page scripts
    const event = new InputEvent('input', { bubbles: true })
    this.selector.dispatchEvent(event)
  }
}
