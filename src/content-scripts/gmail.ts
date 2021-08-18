/**
 * Gmail content script.
 *
 * @module
 */

import type { Report } from '$/report'
import { debug } from 'debug'
import tippy from 'tippy.js'
import { browser } from 'webextension-polyfill-ts'
import { ErrorMessage, ExtensionError } from '$/error'
import { _ } from '$/i18n'
import DecryptButton from './DecryptButton.svelte'
import EncryptButton from './EncryptButton.svelte'
import {
  addClickListener,
  containsEncryptedText,
  decryptString,
  encryptString,
  extractEncryptedString,
  isEncryptedText,
} from './common'

/** Selectors for interesting HTML Elements of Gmail. */
const Selector = {
  MAIL_CONTENT: '.a3s.aiL',
  TOOLBAR: '.J-J5-Ji.btA',
  MAIL_EDITOR: '.iN',
  EDITOR_CONTENT: '[contenteditable]',
  SEND_BUTTON: '.T-I.J-J5-Ji.aoO.v7.T-I-atl.L3',
}

/** A flag to mark already processed (having buttons added) HTML elements. */
const FLAG = 'freemindtronicButtonAdded'

/** Adds a button to a given element to decrypt all encrypted parts found. */
const handleMailElement = (mailElement: HTMLElement) => {
  // Mark the element
  if (FLAG in mailElement.dataset) return
  mailElement.dataset[FLAG] = '1'

  // If it's not an encrypted mail, ignore it
  const mailString = mailElement.textContent
  if (!mailString || !containsEncryptedText(mailString)) return

  // Find all encrypted parts
  const treeWalker = document.createTreeWalker(
    mailElement,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (textNode: Text) =>
        isEncryptedText(textNode.data)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP,
    }
  )

  let node: Node | null
  while ((node = treeWalker.nextNode())) {
    // Add a "Decrypt" button next to the node
    if (!node.parentNode?.textContent) continue
    const encryptedString = extractEncryptedString(node.parentNode.textContent)
    addDecryptButton(node as Text, encryptedString)
  }
}

/** Adds a decryption button next to the text node given. */
const addDecryptButton = (node: Text, encryptedString: string) => {
  // Add the button right before the beginning of the encrypted content
  const target = document.createElement('span')
  const button = new DecryptButton({ target })
  node.before(target)

  /** Frame containing the decrypted mail. */
  let frame: HTMLIFrameElement

  addClickListener(button, (promise, resolved, rejected, signal) => {
    if (resolved) {
      frame.parentNode?.removeChild(frame)
      return
    }

    if (promise && !rejected) return promise

    button.$set({ report: undefined })

    // Decrypt and display
    return decryptString(
      encryptedString,
      (report: Report) => {
        button.$set({ report })
      },
      signal
    ).then((decryptedString) => {
      frame = displayDecryptedMail(
        decryptedString,
        node.parentNode as ParentNode
      )
    })
  })
}

/** Adds an encryption button in the toolbar. */
const handleToolbar = (toolbar: HTMLElement) => {
  if (FLAG in toolbar.dataset) return
  toolbar.dataset[FLAG] = '1'

  const editor = toolbar.closest(Selector.MAIL_EDITOR)
  const mail = editor?.querySelector(Selector.EDITOR_CONTENT)
  const sendButton = editor?.querySelector<HTMLElement>(Selector.SEND_BUTTON)
  if (!editor || !mail || !sendButton) return

  const button = new EncryptButton({
    target: toolbar,
  })

  const tooltip = tippy(sendButton, {
    theme: 'light-border',
  })
  _.subscribe(($_) => {
    tooltip.setContent($_('this-mail-is-not-encrypted'))
  })

  addClickListener(button, async (promise, resolved, rejected, signal) => {
    if (promise && !resolved && !rejected) return promise

    if (!mail.textContent)
      throw new ExtensionError(ErrorMessage.MAIL_CONTENT_UNDEFINED)

    button.$set({ report: undefined })

    // Encrypt and replace
    return encryptString(
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
  })
}

/** Adds a frame containing a given string. */
const displayDecryptedMail = (decryptedString: string, parent: ParentNode) => {
  const frame = document.createElement('iframe')
  Object.assign(frame.style, {
    display: 'block',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
  })

  // To address issues with Gmail's Content-Security-Policy,
  // we need a local frame, that we modify once loaded
  frame.src = browser.runtime.getURL('/blank.html')

  parent.append(frame)
  frame.addEventListener('load', () => {
    if (!frame.contentDocument) throw new Error('Cannot change frame content.')
    // We are injecting raw HTML in a sandboxed environnement,
    // no need to sanitize it
    // eslint-disable-next-line no-unsanitized/property
    frame.contentDocument.body.innerHTML = decryptedString
    // Make the frame as tall as its content
    frame.height = `${frame.contentDocument.body.scrollHeight + 20}`
  })

  return frame
}

/**
 * Handles mutations observed by the `MutationObserver` below, i.e.
 * notifications of elements added or removed from the page.
 */
const handleMutations = () => {
  // The user opens a mail
  const mails = document.body.querySelectorAll<HTMLElement>(
    Selector.MAIL_CONTENT
  )
  for (const mail of mails) handleMailElement(mail)

  // The user starts writing a mail
  const toolbars = document.body.querySelectorAll<HTMLElement>(Selector.TOOLBAR)
  for (const toolbar of toolbars) handleToolbar(toolbar)
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

// Start observing the DOM for changes
new MutationObserver(handleMutations).observe(document.body, {
  subtree: true,
  childList: true,
})
