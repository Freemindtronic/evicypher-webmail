export class Mail {
  selector: Element
  isTextArea: boolean

  constructor(selector: Element) {
    this.selector = selector
    this.isTextArea = selector.localName === 'textarea'
  }

  isEmpty(): boolean {
    if (this.isTextArea)
      return (this.selector as HTMLTextAreaElement).value === ''

    return !this.selector.textContent
  }

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
  }
}
