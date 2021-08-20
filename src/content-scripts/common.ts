/**
 * Common functions for content scripts.
 *
 * @module
 */

import type { Report, Reporter } from '$/report'
import tippy from 'tippy.js'
import { browser } from 'webextension-polyfill-ts'
import { ErrorMessage, ExtensionError } from '$/error'
import { _ } from '$/i18n'
import { startBackgroundTask, Task } from '$/task'
import DecryptButton from './DecryptButton.svelte'
import EncryptButton from './EncryptButton.svelte'

export interface Selectors {
  MAIL_CONTENT: string
  TOOLBAR: string
  MAIL_EDITOR: string
  EDITOR_CONTENT: string
  SEND_BUTTON: string
}

export type Design = 'gmail' | 'outlook' | undefined

export interface Options {
  selectors: Selectors
  design: Design
}

/** A flag to mark already processed (having buttons added) HTML elements. */
const FLAG = 'freemindtronic'

/** Sends a request to the background script to encrypt the given string. */
export const encryptString = async (
  string: string,
  reporter: Reporter,
  signal: AbortSignal
): Promise<string> =>
  startBackgroundTask(
    Task.ENCRYPT,
    async function* () {
      // Suspend the foreground task until the background task asks for a string
      yield
      yield string
    },
    {
      reporter,
      signal,
    }
  )

/** Sends a request to the background script to decrypt the given string. */
export const decryptString = async (
  string: string,
  reporter: Reporter,
  signal: AbortSignal
): Promise<string> =>
  startBackgroundTask(
    Task.DECRYPT,
    async function* () {
      // Suspend the foreground task until the background task asks for a string
      yield
      yield string
    },
    {
      reporter,
      signal,
    }
  )

/** @returns Whether the given string contains a known encryption header */
export const containsEncryptedText = (string: string): boolean =>
  string.includes('AAAAF')

/** @returns Whether the given string is encrypted */
export const isEncryptedText = (string: string): boolean =>
  string.trimStart().startsWith('AAAAF')

/** @returns A trimmed encrypted message */
export const extractEncryptedString = (string: string): string => {
  const extracted = /AAAAF\S*/s.exec(string)?.[0]
  if (!extracted) throw new Error('No encrypted string found to extract.')
  return extracted
}

/**
 * Adds all the listeners necessary to make the button interactive.
 *
 * @remarks
 *   This function ensures that the state of the button is always consistent.
 */
export const addClickListener = (
  button: EncryptButton | DecryptButton,
  listener: (
    promise: Promise<void> | undefined,
    resolved: boolean,
    rejected: boolean,
    signal: AbortSignal
  ) => Promise<void> | undefined
): void => {
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

/** Adds a button to a given element to decrypt all encrypted parts found. */
const handleMailElement = (mailElement: HTMLElement, options: Options) => {
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
    addDecryptButton(node as Text, encryptedString, options)
  }
}

/** Adds a decryption button next to the text node given. */
const addDecryptButton = (
  node: Text,
  encryptedString: string,
  { design }: Options
) => {
  // Add the button right before the beginning of the encrypted content
  const target = document.createElement('span')
  target.style.display = 'block'
  const button = new DecryptButton({
    target,
    props: { design },
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
      frame = displayDecryptedMail(decryptedString, target)
    })
  })
}

/** Adds an encryption button in the toolbar. */
const handleToolbar = (
  toolbar: HTMLElement,
  { selectors, design }: Options
) => {
  const editor = toolbar.closest(selectors.MAIL_EDITOR)
  const mail = editor?.querySelector(selectors.EDITOR_CONTENT)
  const sendButton = editor?.querySelector<HTMLElement>(selectors.SEND_BUTTON)
  if (!editor || !mail || !sendButton) return

  if (FLAG in toolbar.dataset) return
  toolbar.dataset[FLAG] = '1'

  const button = new EncryptButton({
    target: toolbar,
    props: { design },
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
const displayDecryptedMail = (decryptedString: string, node: HTMLElement) => {
  const frame = document.createElement('iframe')
  Object.assign(frame.style, {
    display: 'block',
    width: '100%',
    maxWidth: '100%',
    margin: '10px 0px',
    border: '2px solid #555',
    boxSizing: 'border-box',
  })

  // To address issues with Content-Security-Policy,
  // we need a local frame, that we modify once loaded
  frame.src = browser.runtime.getURL('/blank.html')

  node.after(frame)
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
const handleMutations = (options: Options) => {
  // The user opens a mail
  const mails = document.body.querySelectorAll<HTMLElement>(
    options.selectors.MAIL_CONTENT
  )
  for (const mail of mails) handleMailElement(mail, options)

  // The user starts writing a mail
  const toolbars = document.body.querySelectorAll<HTMLElement>(
    options.selectors.TOOLBAR
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
