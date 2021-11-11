/**
 * _iCloud interface functions for content scripts.
 *
 * @module
 */

import type { Report } from '$/report'
import { debug } from 'debug'
import { convert } from 'html-to-text'
import { get } from 'svelte/store'
import tippy from 'tippy.js'
import { ErrorMessage, ExtensionError } from '$/error'
import { _ } from '$/i18n'
import { isOpenpgpEnabled } from '~src/options'
import EncryptButton from './EncryptButton.svelte'
import { Design } from './design'
import { Mail } from './mail'
import { FLAG, Selectors, Webmail } from './webmail'

class _iCloud extends Webmail {
  /** Observes the DOM for changes. Should work for most webmails. */
  public observe = (): void => {
    // Run the listener on page load

    this.handleMutations()
    // Start observing the DOM for changes
    new MutationObserver(() => {
      this.handleMutations()

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    }).observe(document.querySelector('iframe')!.contentDocument!, {
      subtree: true,
      childList: true,
    })
  }

  /**
   * Handles mutations observed by the `MutationObserver` below, i.e.
   * notifications of elements added or removed from the page.
   */
  protected handleMutations = () => {
    // The user opens a mail
    const frame1 = document.querySelectorAll('iframe')[0]

    console.log('FRAME1:', frame1)

    const mails = frame1?.contentDocument?.querySelectorAll<HTMLElement>(
      this.selectors.mail
    )
    const iframeMail =
      frame1.contentWindow?.document.body.querySelector('iframe')

    console.log('iframeMail:', iframeMail)
    console.log('iframeMailContent:', iframeMail?.contentWindow?.document.body)

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    for (const mail of mails!) this.handleMailElement(mail)

    // The user starts writing a mail
    const toolbars = frame1.contentDocument?.querySelectorAll<HTMLElement>(
      this.selectors.toolbar
    )
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    for (const toolbar of toolbars!) this.handleToolbar(toolbar)
  }

  /** Adds a button to a given element to decrypt all encrypted parts found. */
  protected handleMailElement = (mailElement: HTMLElement): void => {
    // I get the innerText because i need the br tags to be rendered
    // eslint-disable-next-line unicorn/prefer-dom-node-text-content
    const mailStringInnerText = mailElement.innerText

    // If it's not an encrypted mail, ignore it
    const mailString = mailElement.textContent
    if (!mailString || !this.containsEncryptedText(mailString)) return

    // Find all encrypted parts
    const treeWalker = document.createTreeWalker(
      mailElement,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (textNode: Text) =>
          this.isEncryptedText(textNode.data)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP,
      }
    )
    let node: Node | null
    while ((node = treeWalker.nextNode())) {
      // Add a "Decrypt" button next to the node
      if (!node.parentNode?.textContent) continue
      const encryptedString = this.extractEncryptedString(
        node.parentNode.textContent
      )
      const workspace = this.initInjectionTarget(node as Text)
      if (get(isOpenpgpEnabled))
        this.addDecryptButton(workspace, mailStringInnerText)
      else this.addDecryptButton(workspace, encryptedString)

      this.addQRDecryptButton(workspace, encryptedString)
    }
  }

  /** Adds an encryption button in the toolbar. */
  protected handleToolbar(toolbar: HTMLElement): void {
    const editor = toolbar.closest(this.selectors.editor)

    const mailSelector = editor?.querySelector(this.selectors.editorContent)
    const sendButton = editor?.querySelector(this.selectors.send)

    const node = this.encryptButtonSibling(this.selectors, toolbar, editor)

    if (!editor || !mailSelector || !sendButton || !node) return

    const mail = new Mail(mailSelector)

    if (FLAG in toolbar.dataset) return
    toolbar.dataset[FLAG] = '1'

    const target = document.createElement('span')
    target.style.display = 'contents'
    const { design } = this
    const button = new EncryptButton({
      target,
      props: { design },
    })
    node.after(target)

    const tooltip = tippy(sendButton, {
      theme: 'light-border',
    })
    _.subscribe(($_) => {
      tooltip.setContent($_('this-mail-is-not-encrypted'))
    })

    this.addClickListener(
      button,
      async (promise, resolved, rejected, signal) => {
        if (promise && !resolved && !rejected) return promise

        if (mail.isEmpty())
          throw new ExtensionError(ErrorMessage.MailContentUndefined)

        button.$set({ report: undefined })
        let mailContent = mail.getContent()

        if (!get(isOpenpgpEnabled))
          mailContent = convert(mailContent, { wordwrap: 130 })

        // Encrypt and replace
        let encryptedString = await this.encryptString(
          mailContent,
          (report: Report) => {
            button.$set({ report })
          },
          signal
        )
        // Adding \r at the end solves the multiple responses problem
        encryptedString += '\r'
        mail.setContent(encryptedString)
        tooltip.destroy()
      }
    )
  }
}
/** Selectors for interesting HTML Elements of GovernAndorra. */
const selectors: Selectors = {
  mail: '.mail-message-defaults',
  toolbar: '.mail-message-defaults',
  editor: '.',
  editorContent: '.',
  send: '.',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

if (document.location.hostname === 'www.icloud.com') {
  setTimeout(() => {
    const webmail = new _iCloud(selectors, Design.iCloud)
    webmail.observe()
  }, 1000)
} else {
  console.log('---MAIL CHANGED---')
  setTimeout(() => {
    const webmail = new Webmail(selectors, Design.iCloud)
    webmail.observe()
  }, 1000)
}
