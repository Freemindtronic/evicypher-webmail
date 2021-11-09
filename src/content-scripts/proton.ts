/**
 * Proton content script.
 *
 * @module
 */

import type { Report } from '$/report'
import { debug } from 'debug'
import tippy from 'tippy.js'
import { ErrorMessage, ExtensionError } from '$/error'
import { _ } from '$/i18n'
import EncryptButton from './EncryptButton.svelte'
import { Design } from './design'
import { FLAG, Selectors, Webmail } from './webmail'

class Proton extends Webmail {
  /** Adds an encryption button in the toolbar. */
  protected handleToolbar(toolbar: HTMLElement): void {
    const editor = document.querySelector('iframe')
    const mail = editor?.contentDocument?.querySelector(selectors.editorContent)
    const footer = document.querySelector('footer')
    const sendButton = footer?.querySelector('button')
    const node = this.encryptButtonSibling(selectors, toolbar, editor)

    if (!editor || !mail || !sendButton || !node) return

    if (FLAG in toolbar.dataset) return
    toolbar.dataset[FLAG] = '1'

    const { design } = this
    const target = document.createElement('span')
    target.style.display = 'contents'
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

        if (!mail.textContent)
          throw new ExtensionError(ErrorMessage.MailContentUndefined)

        button.$set({ report: undefined })

        // Encrypt and replace
        return this.encryptString(
          // Use innerHTML instead of textContent to support rich text
          mail.innerHTML,
          (report: Report) => {
            button.$set({ report })
          },
          signal
        ).then((encryptedString) => {
          const preTag = document.createElement('pre')
          mail.innerHTML = ''
          preTag.append(encryptedString)
          mail.append(preTag)

          tooltip.destroy()
        })
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
