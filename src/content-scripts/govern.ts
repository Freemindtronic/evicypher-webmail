/**
 * Govern Andorra functions for content scripts.
 *
 * @module
 */

import type { Report } from '$/report'
import { debug } from 'debug'
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
  const editor = toolbar.closest(selectors.editor)
  const mail: HTMLTextAreaElement | undefined | null = editor?.querySelector(
    selectors.editorContent
  )
  const sendButton = editor?.querySelector(selectors.send)
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

    if (mail.value === '')
      throw new ExtensionError(ErrorMessage.MailContentUndefined)

    button.$set({ report: undefined })

    // Encrypt and replace
    let encryptedString = await encryptString(
      // Use value of textarea
      mail.value.replaceAll('\n', '<br>'),
      (report: Report) => {
        button.$set({ report })
      },
      signal
    )
    // Place the encrypted text un a preformatted text element
    encryptedString += '\r'
    mail.value = encryptedString
    tooltip.destroy()
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

/** Selectors for interesting HTML Elements of Govern Andorra Ultra Light. */
const selectors: Selectors = {
  mail: '.msgBody',
  toolbar: '.saveCancelFooter',
  editor: '#theForm',
  editorContent: '#msgBody',
  send: '.headerButtonSave.breadCrumbText',
  encryptButtonSibling: '.memoHeaders',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

// A timeout must be set so that the observer is executed once html is loaded.
setTimeout(() => {
  observe({ selectors, design: Design.GovernAndorra })
}, 500)
