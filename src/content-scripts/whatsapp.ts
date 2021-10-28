/**
 * WhatsApp functions for content scripts.
 *
 * @module
 */

import { debug } from 'debug'
import { handleMailElement, Selectors, Options, handleToolbar } from './common'
import { Design } from './design'

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
  const toolbars = document.querySelectorAll<HTMLElement>(
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
  toolbar: '._1SEwr',
  editor: '._1SEwr',
  send: '._3HQNh._1Ae7k',
  editorContent: '._13NKt.copyable-text.selectable-text[spellcheck="true"]',
  encryptButtonSibling: '._2jitM',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

observe({ selectors, design: Design.WhatsApp })
