/**
 * Proton content script.
 *
 * Some changes in Proton class
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

/**
 * The problem encountered in Proton is that of iFrames. To access the different
 * elements of the page, you have to pass this iframe. That's why, in this case,
 * we don't use most of the selectors.
 *
 * Customisation of {@link handleToolbar}
 */
export class Proton extends Webmail {
  /**
   * Adds an encryption button in the toolbar.
   *
   * Here we customise the handleToolbar function to access the elements. The
   * first step to implement the encryption button is to pass the iframe, so
   * first we access it. Once passed, we access to its editable content where we
   * will collect the text to encrypt. For the position of the button, the
   * toolbar of the mail is in a footer, so we look for a footer and we take the
   * button to send the mail as a reference to position the encryption button next to it.
   */
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
          mail.textContent = encryptedString
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
