/**
 * Outlook content script.
 *
 * @module
 */

import type { Report } from '$/report'
import { debug } from 'debug'
import { browser } from 'webextension-polyfill-ts'
import { ErrorMessage, ExtensionError } from '$/error'
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

/** Selectors for interesting HTML Elements of Outlook. */
const Selector = {
  MAIL_CONTENT: '.QMubUjbS-BOly_BTHEZj7',
  TOOLBAR: '._2ELnTBajF7jzj_m_hoj3Xt',
  MAIL_EDITOR: '._17WvdmDfhREFqBNvlLv75X',
  EDITOR_CONTENT: '[contenteditable]',
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
  const button = new DecryptButton({
    target,
    props: {
      report: undefined,
      promise: undefined,
      design: 'outlook',
    },
  })
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

  const button = new EncryptButton({
    target: toolbar,
    props: {
      report: undefined,
      promise: undefined,
      design: 'outlook',
    },
  })

  addClickListener(button, async (promise, resolved, rejected, signal) => {
    if (promise && !resolved && !rejected) return promise

    const mail = toolbar
      .closest(Selector.MAIL_EDITOR)
      ?.querySelector(Selector.EDITOR_CONTENT)
    if (!mail || !mail.textContent)
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
