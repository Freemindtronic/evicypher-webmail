import type { Report } from 'report'
import { debug } from 'debug'
import { browser } from 'webextension-polyfill-ts'
import { ErrorMessage, ExtensionError } from 'error'
import DecryptButton from './DecryptButton.svelte'
import EncryptButton from './EncryptButton.svelte'
import {
  containsEncryptedText,
  decryptString,
  encryptString,
  extractEncryptedString,
  isEncryptedText,
} from './encryption'

/** Selectors for interesting HTML Elements of Gmail. */
const Selector = {
  MAIL_CONTENT: '.a3s.aiL',
  TOOLBAR: '.btx',
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

  const button = new EncryptButton({
    target: toolbar,
  })

  addClickListener(button, async (promise, resolved, rejected, signal) => {
    if (promise && !resolved && !rejected) return promise

    const mail = toolbar.closest('.iN')?.querySelector('[contenteditable]')
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

/**
 * Adds all the listeners necessary to make the button interactive.
 *
 * @remarks
 *   This function ensures that the state of the button is always consistent.
 */
const addClickListener = (
  button: EncryptButton | DecryptButton,
  listener: (
    promise: Promise<void> | undefined,
    resolved: boolean,
    rejected: boolean,
    signal: AbortSignal
  ) => Promise<void> | undefined
) => {
  /** Abort controller, bound to a button in the tooltip. */
  let controller: AbortController
  button.$on('abort', () => {
    controller.abort()
    promise = undefined
    button.$set({ promise })
  })

  let promise: Promise<void> | undefined
  let resolved = false
  let rejected = false

  // When the button is clicked, trigger the event listener
  button.$on('click', () => {
    if (promise === undefined) controller = new AbortController()
    promise = listener(promise, resolved, rejected, controller.signal)
    button.$set({ promise })
    resolved = false
    rejected = false
    promise
      ?.then(() => {
        resolved = true
      })
      .catch(() => {
        rejected = true
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
const handleMutation = (mutation: MutationRecord) => {
  const target = mutation.target as HTMLElement
  // A mail element is added
  if (target.matches(Selector.MAIL_CONTENT)) handleMailElement(target)

  const mailElements = target.querySelectorAll<HTMLElement>(
    Selector.MAIL_CONTENT
  )
  for (const mailElement of mailElements) handleMailElement(mailElement)

  // The user starts writing a mail
  if (target.matches(Selector.TOOLBAR)) handleToolbar(target)
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

// Start observing the DOM for changes
new MutationObserver((mutations) => {
  for (const mutation of mutations) handleMutation(mutation)
}).observe(document.body, {
  subtree: true,
  childList: true,
})
