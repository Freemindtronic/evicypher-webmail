/* eslint-disable complexity */
/**
 * Proton content script.
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
import { Design } from './design'
import { Mail } from './mail'
import { FLAG, Selectors, Webmail } from './webmail'

class Proton extends Webmail {
  /** Adds a button to a given element to decrypt all encrypted parts found. */
  protected handleMailElement = (mailElement: HTMLElement): void => {
    // Mark the element
    if (FLAG in mailElement.dataset) return
    mailElement.dataset[FLAG] = '1'

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
      this.addDecryptButton(workspace, encryptedString)
      if (!get(isOpenpgpEnabled))
        this.addQRDecryptButton(workspace, encryptedString)
    }
  }

  /** Adds an encryption button in the toolbar. */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  protected handleToolbar(toolbar: HTMLElement): void {
    // The thing is that if we have an email opened that has an iframe we should get the second iframe, otherwise the mailSelector
    // coming next will be null
    // and if only exist one iframe, just takes the only one, from the contentEditor of the mail
    const editor =
      document.querySelectorAll('iframe').length > 1
        ? document.querySelectorAll('iframe')[1]
        : document.querySelectorAll('iframe')[0]

    const mailSelector = editor?.contentDocument?.querySelector(
      selectors.editorContent
    )

    const footer = document.querySelector('footer')
    const sendButton = footer?.querySelector('button')
    const node = this.encryptButtonSibling(selectors, toolbar, editor)

    if (!editor || !mailSelector || !sendButton || !node) return

    const mail = new Mail(mailSelector)

    if (FLAG in toolbar.dataset) return
    toolbar.dataset[FLAG] = '1'

    const tooltip = tippy(sendButton, {
      theme: 'light-border',
    })
    _.subscribe(($_) => {
      tooltip.setContent($_('this-mail-is-not-encrypted'))
    })

    const button = this.addEncryptButton(node)

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

  /**
   * Handles mutations observed by the `MutationObserver` below, i.e.
   * notifications of elements added or removed from the page.
   */
  protected handleMutations = (): void => {
    // The user opens a mail

    // The selector is different depending if it is Legacy or PGP
    this.selectors.mail = get(isOpenpgpEnabled)
      ? '.message-content > :first-child'
      : '#proton-root'

    const pre = document.querySelector('pre.m0')
    if (!pre) this.selectors.mail = '#proton-root'

    const mails = document.body.querySelectorAll<HTMLElement>(
      this.selectors.mail
    )
    for (const mail of mails) this.handleMailElement(mail)

    // The user starts writing a mail
    const toolbars = document.body.querySelectorAll<HTMLElement>(
      this.selectors.toolbar
    )
    for (const toolbar of toolbars) this.handleToolbar(toolbar)
  }
}

/** Selectors for interesting HTML Elements of Proton. */
const selectors: Selectors = {
  // The selector is different depending if it is Legacy or PGP
  mail: '.m0',
  toolbar: '.composer-actions',
  // Selectors below are not used because CSS selectors cannot get through iframe
  editor: '.',
  editorContent: '[contenteditable]',
  send: '.',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

const webmail = new Proton(selectors, Design.Proton)
webmail.observe()
