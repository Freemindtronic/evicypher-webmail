/**
 * Proton content script.
 *
 * @module
 */

import type { Report } from '$/report'
import { debug } from 'debug'
import { convert } from 'html-to-text'
import tippy from 'tippy.js'
import { ErrorMessage, ExtensionError } from '$/error'
import { _ } from '$/i18n'
import EncryptButton from './EncryptButton.svelte'
import {
  addClickListener,
  encryptButtonSibling,
  encryptString,
  FLAG,
  handleMailElement,
  Options,
  Selectors,
} from './common'
import { Design } from './design'

/** Adds an encryption button in the toolbar. */
const handleToolbar = (
  toolbar: HTMLElement,
  { selectors, design }: Options
) => {
  const editor = document.querySelector('iframe')
  const mail = editor?.contentDocument?.querySelector(selectors.editorContent)
  const footer = document.querySelector('footer')
  const sendButton = footer?.querySelector('button')
  const node = encryptButtonSibling(selectors, toolbar, editor)

  if (!editor || !mail || !sendButton || !node) return

  if (FLAG in toolbar.dataset) return
  toolbar.dataset[FLAG] = '1'

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

  addClickListener(button, async (promise, resolved, rejected, signal) => {
    if (promise && !resolved && !rejected) return promise

    if (!mail.textContent)
      throw new ExtensionError(ErrorMessage.MailContentUndefined)

    button.$set({ report: undefined })

    // Use innerHTML instead of textContent to support rich text
    const htmlText = mail.innerHTML

    // Convert html text to plaintext for easier reading on Android App
    const plainText = convert(htmlText, { wordwrap: 130 })

    // Encrypt and replace
    return encryptString(
      plainText,
      (report: Report) => {
        button.$set({ report })
      },
      signal
    ).then((encryptedString) => {
      mail.textContent = encryptedString
      tooltip.destroy()
    })
  })
}

/**
 * Handles mutations observed by the `MutationObserver` below, i.e.
 * notifications of elements added or removed from the page.
 */
const handleMutations = (options: Options) => {
  // The user opens a mail
  const mails = document.body.querySelectorAll<HTMLElement>(
    options.selectors.mail
  )
  for (const mail of mails) handleMailElement(mail, options)

  // The user starts writing a mail
  const toolbars = document.body.querySelectorAll<HTMLElement>(
    options.selectors.toolbar
  )
  for (const toolbar of toolbars) handleToolbar(toolbar, options)
}

/** Observes the DOM for changes. Should work for most webmails. */
export const observe = (options: Options): void => {
  // Run the listener on page load
  handleMutations(options)
  // Start observing the DOM for changes
  new MutationObserver(() => {
    handleMutations(options)
  }).observe(document.body, {
    subtree: true,
    childList: true,
  })
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

observe({ selectors, design: Design.Proton })
