/**
 * Govern Andorra Full mode interface functions for content scripts.
 *
 * @module
 */

import type { Report, Reporter } from '$/report'
import { debug } from 'debug'
import tippy from 'tippy.js'
import { browser } from 'webextension-polyfill-ts'
import { ErrorMessage, ExtensionError } from '$/error'
import { _ } from '$/i18n'
import { startBackgroundTask, Task } from '$/task'
import QRCode from '../components/QRCode.svelte'
import DecryptButton from './DecryptButton.svelte'
import EncryptButton from './EncryptButton.svelte'
import QRCodeButton from './QRCodeButton.svelte'
import { Design } from './design'

export interface Selectors {
  /**
   * Mail element. All mail elements are processed to find encrypted text. If a
   * mail contains encrypted text, a Decrypt button is added.
   */
  mail: string
  /** Editor toolbar, where the Encrypt button will be added. */
  toolbar: string
  /** Mail editor. */
  editor: string
  /** Mail editor content. */
  editorContent: string
  /** Send button. A tooltip is added to the button if the mail written is not encrypted. */
  send: string
  /**
   * Place the encryption button right after this element. If not defined, place
   * it at the end of the toolbar.
   */
  encryptButtonSibling?: string
}

export interface Options {
  selectors: Selectors
  design: Design
}

/** A flag to mark already processed (having buttons added) HTML elements. */
export const FLAG = 'freemindtronic'

/** Sends a request to the background script to encrypt the given string. */
export const encryptString = async (
  string: string,
  reporter: Reporter,
  signal: AbortSignal
): Promise<string> =>
  startBackgroundTask(
    Task.Encrypt,
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
    Task.Decrypt,
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
  string.includes('-----BEGIN PGP MESSAGE-----') &&
  string.includes('-----END PGP MESSAGE-----')

/** @returns Whether the given string is encrypted */
export const isEncryptedText = (string: string): boolean =>
  string.trimStart().startsWith('-----BEGIN PGP MESSAGE-----')

/** @returns A trimmed encrypted message */
const extractEncryptedString = (string: string): string => {
  const extracted =
    /-----BEGIN PGP MESSAGE-----.+-----END PGP MESSAGE-----/s.exec(string)?.[0]
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
export const handleMailElement = (
  mailElement: HTMLElement,
  options: Options
): void => {
  // Mark the element
  if (FLAG in mailElement.dataset) return
  mailElement.dataset[FLAG] = '1'

  // I get the innerHTML because i need the br tags to put later the \n to avoid
  // the formatting error from the foreground task
  const mailStringInnerHTML = mailElement.innerHTML

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
    addDecryptButton(node as Text, mailStringInnerHTML, options)
    addQRDecryptButton(node as Text, encryptedString, options)
  }
}

/** Adds a decryption button next to the text node given. */

export const addDecryptButton = (
  node: Text,
  encryptedString: string,
  { design }: Options
): void => {
  // Add the button right before the beginning of the encrypted content
  const target = document.createElement('span')
  target.style.display = 'block'
  target.id = 'DecryptSpan'

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

    // The encryptedString is the string with all the HTML tags
    // so first I take away the div tags and i left the br only
    const stringWithBrTags = encryptedString.slice(75, -21)
    // I treat the <br> and put \n
    // with this I avoid the foreground task formnatting error
    const encryptedStringCorrected = stringWithBrTags.replaceAll('<br>', '\n')

    // Decrypt and display
    return decryptString(
      encryptedStringCorrected,
      (report: Report) => {
        button.$set({ report })
      },
      signal
    ).then((decryptedString) => {
      frame = displayDecryptedMail(decryptedString, target)
    })
  })
}

/** Adds a QR code button next to the Decrypt Button. */
export const addQRDecryptButton = (
  node: Text,
  encryptedString: string,
  { design }: Options
): void => {
  const frame1 = document.querySelectorAll('frame')[0]
  const target = frame1?.contentDocument?.querySelector('#DecryptSpan')
  if (!target) throw new Error('The element #target not found')

  const button = new QRCodeButton({
    target,
    props: { design },
  })
  node.before(target)

  /** Frame containing the decrypted mail. */
  let frame: HTMLIFrameElement

  addClickListener(button, (promise, resolved, rejected) => {
    if (resolved) {
      frame.parentNode?.removeChild(frame)
      return
    }

    if (promise && !rejected) return promise

    button.$set({ report: undefined })

    frame = displayQREncryptedMail(encryptedString, target as HTMLElement)
  })
}

/** Returns the element to place the encrytion button after. */
export const encryptButtonSibling = (
  { encryptButtonSibling }: Selectors,
  toolbar: Element,
  editor: Element | null
): ChildNode | undefined =>
  (encryptButtonSibling === undefined
    ? toolbar.lastChild
    : editor?.querySelector(encryptButtonSibling)) ?? undefined

/** Adds an encryption button in the toolbar. */
const handleToolbar = (toolbar: HTMLElement, { design }: Options) => {
  console.log('toolbnar', toolbar)
  const editor = document
    .querySelector('frame')
    ?.contentDocument?.querySelector(
      '#e-content-inner > div:nth-child(1) > div:nth-child(1) > div:nth-child(1)'
    )
  console.log('editor', editor)
  const mail = editor?.querySelectorAll('iframe')[2]
  console.log('mail', mail)
  const sendButton = document
    .querySelector('frame')
    ?.contentDocument?.querySelector('#e-actions-mailedit-send-text')
  console.log('sendButton', sendButton)

  const node = document
    .querySelector('frame')
    ?.contentDocument?.querySelector(
      '#e-$new-0-bodyrich-commands > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1)'
    )

  console.log('HOLIS')

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
export const displayDecryptedMail = (
  decryptedString: string,
  node: HTMLElement
): HTMLIFrameElement => {
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

/** Adds a frame containing a QRCode. */
export const displayQREncryptedMail = (
  encryptedString: string,
  node: HTMLElement
): HTMLIFrameElement => {
  const frame = document.createElement('iframe')
  frame.id = 'iframeid'

  if (encryptedString.length > 2331) {
    let errorMsg = ''

    _.subscribe(($_) => {
      errorMsg = $_(
        'the-message-exceeds-the-maximum-number-of-characters-allowed'
      )
    })
    // eslint-disable-next-line no-alert
    alert(errorMsg + '\n' + encryptedString.length.toString() + '/2331')
  } else {
    // Check if QRCode Iframe already exist and remove it
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const frame1 = document.querySelector('frame')!.contentDocument!.body
    const frame2 = frame1.querySelectorAll('iframe')[2]
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    frame2?.remove()

    Object.assign(frame.style, {
      display: 'block',
      maxWidth: '100%',
      margin: '10px 0px',
      border: '2px solid #555',
      boxSizing: 'border-box',
    })

    node.after(frame)
    frame.addEventListener('load', () => {
      if (!frame.contentDocument)
        throw new Error('Cannot change frame content.')

      // We create a Span inside the iframe to put the QRCode Element
      const target = document.createElement('span')
      target.id = 'spanQR'
      target.style.display = 'contents'

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const QR = new QRCode({
        target,
        props: {
          data: encryptedString,
          size: 100,
          scale: 3,
        },
      })
      frame.contentWindow?.document.body.append(target)

      // We take the QRCode Height and copy it to the frame

      const canvas = frame.contentDocument?.querySelector('canvas')
      const height = canvas?.style.height

      if (height === undefined) return

      const FrameHeightWidht = Number.parseInt(height, 10) + 20

      frame.style.height = FrameHeightWidht.toString() + 'px'

      frame.style.width = FrameHeightWidht.toString() + 'px'
    })
  }

  return frame
}

/**
 * Handles mutations observed by the `MutationObserver` below, i.e.
 * notifications of elements added or removed from the page.
 */
const handleMutations = (options: Options) => {
  // The user opens a mail
  const frame1 = document.querySelectorAll('frame')[0]

  const mails = frame1?.contentDocument?.querySelectorAll<HTMLElement>(
    options.selectors.mail
  )
  console.log('MAILSS:', mails)

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  for (const mail of mails!) handleMailElement(mail, options)

  // The user starts writing a mail
  const toolbars = frame1.contentDocument?.querySelectorAll<HTMLElement>(
    options.selectors.toolbar
  )
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  for (const toolbar of toolbars!) handleToolbar(toolbar, options)
}

/** Observes the DOM for changes. Should work for most webmails. */
export const observe = (options: Options): void => {
  // Run the listener on page load
  handleMutations(options)
  // Start observing the DOM for changes
  new MutationObserver(() => {
    handleMutations(options)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  }).observe(document.body.querySelector('frame')!.contentDocument!.body, {
    subtree: true,
    childList: true,
  })
}

/** Selectors for interesting HTML Elements of GovernAndorra. */
const selectors: Selectors = {
  mail: '.s-mailbody',
  toolbar: '#e-toolbar',
  editor: '',
  editorContent: '',
  send: '',
}

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

setTimeout(() => {
  observe({ selectors, design: Design.GovernAndorra })
}, 1000)
