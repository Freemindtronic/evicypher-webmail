/* eslint-disable complexity */
/**
 * Horde interface functions for content scripts.
 *
 * @module
 * @see {@link Horde}
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
import { FLAG, Selectors, Webmail } from './webmail'

class Horde extends Webmail {
  /**
   * Handles mutations observed by the `MutationObserver` below, i.e.
   * notifications of elements added or removed from the page.
   */
  protected handleMutations = (): void => {
    // The user opens a mail
    const mails = document.body.querySelectorAll<HTMLElement>(
      this.selectors.mail
    )
    for (const mail of mails) this.handleMailElement(mail)

    // The user starts writing a mail
    const toolbars = document.body.querySelectorAll<HTMLElement>(
      this.selectors.toolbar
    )
    for (const toolbar of toolbars) this.handleToolbarHorde(toolbar)
  }

  /** Adds an encryption button in the toolbar. */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  protected handleToolbarHorde(toolbar: HTMLElement): void {
    const iframe = document.querySelector('iframe')

    const mailSelector = iframe?.contentDocument?.querySelector(
      selectors.editorContent
    )
    const sendButton = document.querySelector(this.selectors.send)

    const node = document.querySelector('#cke_composeMessage')

    if (!mailSelector || !sendButton || !node) return

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

        if (!mailSelector.textContent)
          throw new ExtensionError(ErrorMessage.MailContentUndefined)

        button.$set({ report: undefined })
        let mailSelectorContent = mailSelector.textContent

        if (!get(isOpenpgpEnabled))
          mailSelectorContent = convert(mailSelectorContent, { wordwrap: 130 })

        // Encrypt and replace
        let encryptedString = await this.encryptString(
          mailSelectorContent,
          (report: Report) => {
            button.$set({ report })
          },
          signal
        )
        // Adding \r at the end solves the multiple responses problem
        encryptedString += '\r'

        mailSelector.innerHTML = ''

        if (encryptedString.startsWith('AAAAF')) {
          mailSelector.textContent = encryptedString
        } else {
          // For some reason horde messages needs to be in the following format to be able to detect
          // injected text like our encrypted string
          // part message 1<br>
          // part message 2<br> etc...
          let position: number
          let aux = encryptedString

          /**
           * The way I do it it always remains one \n at the end to the final
           * length is going to be 1
           */
          while (encryptedString.length !== 1) {
            position = encryptedString.indexOf('\n')
            aux = encryptedString.slice(0, position)
            encryptedString = encryptedString.slice(
              position + 1,
              encryptedString.length
            )

            const br = document.createElement('br')
            mailSelector.append(aux)
            mailSelector.append(br)
          }
        }

        tooltip.destroy()
      }
    )
  }
}

/** Selectors for interesting HTML Elements of Horde. */
const selectors: Selectors = {
  mail: '.fixed.leftAlign',
  toolbar: '.horde-buttonbar',
  // Not needed
  editor: '.',
  editorContent: '.cke_show_borders',
  send: '.horde-icon',
  isBefore: true,
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

setTimeout(() => {
  const webmail = new Horde(selectors, Design.Horde)
  webmail.observe()
}, 1000)
