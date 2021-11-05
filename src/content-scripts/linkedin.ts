/* eslint-disable complexity */
/* eslint-disable sonarjs/cognitive-complexity */
/**
 * Linkedin functions for content scripts.
 *
 * @module
 */

import type { Report } from '$/report'
import { debug } from 'debug'
import tippy from 'tippy.js'
import { _ } from '$/i18n'
import { ErrorMessage, ExtensionError } from '~src/error'
import EncryptButton from './EncryptButton.svelte'
import {
  addClickListener,
  addDecryptButton,
  addQRDecryptButton,
  containsEncryptedText,
  encryptString,
  FLAG,
  isEncryptedText,
  Options,
  Selectors,
  extractEncryptedString,
} from './common'
import { Design } from './design'

/** Adds a button to a given element to decrypt all encrypted parts found. */
export const handleMailElement = (
  mailElement: HTMLElement,
  options: Options
): void => {
  // Mark the element
  if (FLAG in mailElement.dataset) return
  mailElement.dataset[FLAG] = '1'

  // If it's not an encrypted mail, ignore it
  if (mailElement === null) return

  const mailString = mailElement?.querySelector(
    '.msg-s-event-listitem__body'
  )?.textContent

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
    addQRDecryptButton(node as Text, encryptedString, options)
  }
}

/** Adds an encryption button in the toolbar. */
const handleToolbar = (mailElements: MailElements, { design }: Options) => {
  if (mailElements.toolbar === null || mailElements.toolbar === undefined)
    return

  const node = mailElements.toolbar.firstElementChild?.children[3]

  if (
    !mailElements.editor ||
    !mailElements.editorContent ||
    !mailElements.send ||
    !node
  )
    return

  if (FLAG in mailElements.toolbar.dataset) return
  mailElements.toolbar.dataset[FLAG] = '1'

  const target = document.createElement('span')
  target.id = 'EncryptButton'
  target.style.display = 'contents'
  const button = new EncryptButton({
    target,
    props: { design },
  })
  node.after(target)

  const tooltip = tippy(mailElements.send, {
    theme: 'light-border',
  })
  _.subscribe(($_) => {
    tooltip.setContent($_('this-mail-is-not-encrypted'))
  })

  addClickListener(button, async (promise, resolved, rejected, signal) => {
    if (promise && !resolved && !rejected) return promise
    if (mailElements.editorContent === undefined) return
    if (mailElements.editorContent?.textContent === '')
      throw new ExtensionError(ErrorMessage.MailContentUndefined)

    button.$set({ report: undefined })
    if (mailElements.editorContent === null) return
    // Encrypt and replace
    let encryptedString = await encryptString(
      // Use innerHTML instead of textContent to support rich text
      mailElements.editorContent.innerHTML,
      (report: Report) => {
        button.$set({ report })
      },
      signal
    )

    encryptedString += '\r'

    mailElements.editorContent.innerHTML = ''
    // For some reason linkedin messages needs to be in the following format to be able to detect
    // injected text like our encrypted string
    // <p> message <br></p>
    const p = document.createElement('p')
    const br = document.createElement('br')
    p.append(encryptedString)
    p.append(br)
    mailElements.editorContent.append(p)

    const event = new InputEvent('input', { bubbles: true })

    mailElements.editorContent.dispatchEvent(event)

    tooltip.destroy()
  })
}

/**
 * Handles mutations observed by the `MutationObserver` below, i.e.
 * notifications of elements added or removed from the page.
 */
const handleMutations = (options: Options) => {
  const mails = document.body.querySelectorAll<HTMLElement>(
    options.selectors.mail
  )
  for (const mail of mails) handleMailElement(mail, options)

  // First window of linkedin editor
  const firstWindow = document.querySelector(
    '.scaffold-layout__list-detail-inner'
  )
  // Second window of linkedin editor
  const secondWindow = document.querySelector(
    '.msg-convo-wrapper.msg-overlay-conversation-bubble'
  )

  if (!firstWindow && !secondWindow) return

  /** Create a new MailElement */
  const mailElement: MailElements = {}

  /** If both windows are shown */
  if (firstWindow && secondWindow) {
    /** Array of Elements to iterate over all elements for both windows editors in linkedin */
    const windows: Element[] = [firstWindow, secondWindow]

    /**
     * I loop for every window editor and then call the handleToolbar so inside
     * the function know that a certain editor belongs in the window and not
     * from the other one, so when you click in encrypt he knows that he has to
     * put the content encrypted in the editorContent of his window.
     */
    for (const window of windows) {
      /**
       * Because both windows has the same class I can do a querySelector to
       * obtain the toolbar, ... from the certain window and the call the
       * handleToolbar function
       */
      mailElement.toolbar = window.querySelector<HTMLElement>(selectors.toolbar)
      mailElement.editor = window.querySelector<HTMLElement>(selectors.editor)
      mailElement.editorContent = window.querySelector<HTMLElement>(
        selectors.editorContent
      )
      mailElement.send = window.querySelector<HTMLElement>(selectors.send)
      handleToolbar(mailElement, options)
    }
  } else {
    /**
     * If only one of both the windows are shown generalWindow variable will be
     * the only active window, and then do the same as above, assign all the
     * elements from the Selectors and the call the function
     */
    let generalWindow: Element | undefined | null
    if (firstWindow) generalWindow = firstWindow
    else if (secondWindow) generalWindow = secondWindow

    mailElement.toolbar = generalWindow?.querySelector<HTMLElement>(
      selectors.toolbar
    )
    mailElement.editor = generalWindow?.querySelector<HTMLElement>(
      selectors.editor
    )
    mailElement.editorContent = generalWindow?.querySelector<HTMLElement>(
      selectors.editorContent
    )
    mailElement.send = generalWindow?.querySelector<HTMLElement>(selectors.send)
    handleToolbar(mailElement, options)
  }
}

/** HTMLElements from all the parts of a certain window */
export interface MailElements {
  toolbar?: HTMLElement | null
  editor?: HTMLElement | null
  editorContent?: HTMLElement | null
  send?: HTMLElement | null
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

/** Selectors for interesting HTML Elements of Linkedin. */
/** Both windows from linkedin shares the same class selectors */
const selectors: Selectors = {
  mail: '.msg-s-event__content',
  toolbar: '.msg-form__footer',
  editor: '.msg-form',
  editorContent: '.msg-form__contenteditable',
  send: '.msg-form__send-button',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

setTimeout(() => {
  observe({ selectors, design: Design.Linkedin })
}, 2000)
