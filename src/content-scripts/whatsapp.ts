/* eslint-disable complexity */
/* eslint-disable sonarjs/cognitive-complexity */
/**
 * WhatsApp functions for content scripts.
 *
 * @module
 */

import type { Report } from '$/report'
import type { Selectors, Options } from './common'
import { debug } from 'debug'
import tippy from 'tippy.js'
import { _ } from '$/i18n'
import { ErrorMessage, ExtensionError } from '~src/error'
import EncryptButton from './EncryptButton.svelte'
import {
  FLAG,
  addClickListener,
  encryptString,
  handleMailElement,
} from './common'
import { Design } from './design'

/** Adds an encryption button in the toolbar. */
const handleToolbar = (toolbar: HTMLElement, { design }: Options) => {
  const chat = document.querySelector('.y8WcF')
  const footer = document.querySelector('._2cYbV')
  const sendButton = document.querySelector('._3HQNh._1Ae7k')
  const message = document.querySelectorAll(
    '._13NKt.copyable-text.selectable-text'
  )[1]
  const node = document.querySelector('._2jitM')
  const finalMessage = message.textContent
  if (!finalMessage) return

  if (!chat || !footer || !sendButton || !node) return

  if (FLAG in toolbar.dataset) return
  toolbar.dataset[FLAG] = '1'

  const target = document.createElement('span')
  target.id = 'EncryptButton'
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

    if (finalMessage === '')
      throw new ExtensionError(ErrorMessage.MailContentUndefined)

    button.$set({ report: undefined })

    // Encrypt and replace
    let encryptedString = await encryptString(
      // Use innerHTML instead of textContent to support rich text
      message.innerHTML,
      (report: Report) => {
        button.$set({ report })
      },
      signal
    )

    encryptedString += '\r'
    message.textContent = encryptedString

    const event = new InputEvent('input', { bubbles: true })

    message.dispatchEvent(event)
    tooltip.destroy()
  })
}

/**
 * Handles mutations observed by the `MutationObserver` below, i.e.
 * notifications of elements added or removed from the page.
 */
const handleMutations = (options: Options) => {
  // A message-out --> class where your messages are
  // A message-in --> class where other messages are
  const mails = document.body.querySelectorAll<HTMLElement>(
    '.message-out, .message-in'
  )
  for (const mail of mails) handleMailElement(mail, options)

  // The user starts writing a mail
  const toolbars = document.body.querySelectorAll<HTMLElement>(
    options.selectors.toolbar
  )

  for (const toolbar of toolbars) handleToolbar(toolbar, options)
}

/** Observes the DOM for changes. Should work for most webmails. */
const observe = (options: Options): void => {
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

/** Selectors for interesting HTML Elements of Gmail. */
const selectors: Selectors = {
  mail: '.ldL67._3sh5K',
  toolbar: '._23P3O',
  editor: '.y8WcF',
  editorContent: '[contenteditable]',
  send: '._4sWnG',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

observe({ selectors, design: Design.WhatsApp })
