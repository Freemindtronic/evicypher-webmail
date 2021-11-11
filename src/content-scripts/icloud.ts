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

class ICloud extends Webmail {
  /** Adds an encryption button in the toolbar. */
  protected handleToolbar(toolbar: HTMLElement): void {
    const editor = toolbar.closest(this.selectors.editor)
    const mailSelector = editor?.querySelector(this.selectors.editorContent)
    const sendButton = editor?.querySelector(this.selectors.send)
    const node = editor?.querySelector('.editor-wrapper')

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
    node.before(target)

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
  toolbar: '.ic-dupl4g',
  editor: '.cw-pane-container',
  editorContent: '.editor-content',
  send: '.editor-content',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

setTimeout(() => {
  const webmail = new ICloud(selectors, Design.iCloud)
  webmail.observe()
}, 1000)
