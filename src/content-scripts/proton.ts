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
  /** Adds an encryption button in the toolbar. */

  protected handleToolbar(toolbar: HTMLElement): void {
    const editor = document.querySelector('iframe')
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
}

/** Selectors for interesting HTML Elements of Proton. */
const selectors: Selectors = {
  mail: '.message-content > :first-child',
  toolbar: '.composer-actions',
  // Selectors below are not used because CSS selectors cannot get through iframe
  editor: '',
  editorContent: '[contenteditable]',
  send: '',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

const webmail = new Proton(selectors, Design.Proton)
webmail.observe()
