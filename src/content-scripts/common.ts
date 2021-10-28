/**
 * Common functions for content scripts.
 *
 * @module
 */

import type { Report, Reporter } from '$/report'
import type { Design } from './design'
import * as base85 from 'base85'
import { convert } from 'html-to-text'
import { Base64 } from 'js-base64'
import { get } from 'svelte/store'
import tippy from 'tippy.js'
import { ErrorMessage, ExtensionError } from '$/error'
import { _ } from '$/i18n'
import { startBackgroundTask, Task } from '$/task'
import { isOpenpgpEnabled } from '~src/options'
import QRCode from '../components/QRCode.svelte'
import DecryptButton from './DecryptButton.svelte'
import EncryptButton from './EncryptButton.svelte'
import QRCodeButton from './QRCodeButton.svelte'
import { Mail } from './mail'

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
export const containsEncryptedText = (string: string): boolean => {
  if (get(isOpenpgpEnabled)) {
    return (
      string.includes('-----BEGIN PGP MESSAGE-----') &&
      string.includes('-----END PGP MESSAGE-----')
    )
  }

  return string.includes('AAAAF')
}

/** @returns Whether the given string is encrypted */
export const isEncryptedText = (string: string): boolean => {
  if (get(isOpenpgpEnabled))
    return string.trimStart().startsWith('-----BEGIN PGP MESSAGE-----')

  return string.trimStart().startsWith('AAAAF')
}

/** @returns A trimmed encrypted message */
export const extractEncryptedString = (string: string): string => {
  const extracted = get(isOpenpgpEnabled)
    ? /-----BEGIN PGP MESSAGE-----.+-----END PGP MESSAGE-----/s.exec(
        string
      )?.[0]
    : /AAAAF\S*/s.exec(string)?.[0]

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
    const workspace = initInjectionTarget(node as Text)
    addDecryptButton(workspace, encryptedString, options)
    addQRDecryptButton(workspace, encryptedString, options)
  }
}

type Workspace = {
  buttonArea: HTMLDivElement
  iframeArea: HTMLDivElement
}

export const initInjectionTarget = (node: Text): Workspace => {
  const workspace = document.createElement('div')
  workspace.id = 'evicypher-workspace'
  const buttonArea = document.createElement('div')
  buttonArea.id = 'evicypher-area-button'
  const iframeArea = document.createElement('div')
  iframeArea.id = 'evicypher-area-iframe'
  workspace.append(buttonArea)
  workspace.append(iframeArea)
  node.before(workspace)
  return { buttonArea, iframeArea }
}

/** Adds a decryption button next to the text node given. */
export const addDecryptButton = (
  workspace: Workspace,
  encryptedString: string,
  { design }: Options
): void => {
  // Add the button right before the beginning of the encrypted content
  const target = document.createElement('span')
  target.style.display = 'inline'
  target.id = 'DecryptSpan'

  const button = new DecryptButton({
    target,
    props: { design },
  })

  workspace.buttonArea.append(target)

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
      frame = displayDecryptedMail(decryptedString, workspace.iframeArea)
    })
  })
}

/** Adds a QR code button next to the Decrypt Button. */
export const addQRDecryptButton = (
  workspace: Workspace,
  encryptedString: string,
  { design }: Options
): void => {
  const target = document.createElement('span')
  target.style.display = 'inline'
  target.id = 'QRCodeSpan'

  const button = new QRCodeButton({
    target,
    props: { design },
  })
  workspace.buttonArea.append(target)

  /** Frame containing the decrypted mail. */
  let frame: HTMLIFrameElement

  addClickListener(button, (promise, resolved, rejected) => {
    if (resolved) {
      frame.parentNode?.removeChild(frame)
      return
    }

    if (promise && !rejected) return promise

    button.$set({ report: undefined })

    let encryptedStringToDisplay = encryptedString

    if (!get(isOpenpgpEnabled)) {
      const rawData = Base64.toUint8Array(encryptedStringToDisplay)

      // Re-encode data in Ascii85 for a smaller QRcode
      encryptedStringToDisplay = base85.encode(Buffer.from(rawData), 'ascii85')
      // Remove enclosure added by the base85 lib
      encryptedStringToDisplay = encryptedStringToDisplay.slice(2, -2)
    }

    frame = displayQREncryptedMail(
      encryptedStringToDisplay,
      workspace.iframeArea
    )
  })
}

/** Returns the element to place the encryption button after. */
export const encryptButtonSibling = (
  { encryptButtonSibling }: Selectors,
  toolbar: Element,
  editor: Element | null
): ChildNode | undefined =>
  (encryptButtonSibling === undefined
    ? toolbar.lastChild
    : editor?.querySelector(encryptButtonSibling)) ?? undefined

/** Adds an encryption button in the toolbar. */
export const handleToolbar = (
  toolbar: HTMLElement,
  { selectors, design }: Options
): void => {
  const editor = toolbar.closest(selectors.editor)
  const mailSelector = editor?.querySelector(selectors.editorContent)
  const sendButton = editor?.querySelector(selectors.send)
  const node = encryptButtonSibling(selectors, toolbar, editor)
  if (!editor || !mailSelector || !sendButton || !node) return

  const mail = new Mail(mailSelector)

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

    if (mail.isEmpty())
      throw new ExtensionError(ErrorMessage.MailContentUndefined)

    button.$set({ report: undefined })

    let mailContent = mail.getContent()

    if (!get(isOpenpgpEnabled))
      mailContent = convert(mailContent, { wordwrap: 130 })

    // Encrypt and replace
    let encryptedString = await encryptString(
      mailContent,
      (report: Report) => {
        button.$set({ report })
      },
      signal
    )

    encryptedString += '\r'
    mail.setContent(encryptedString)
    tooltip.destroy()
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
    background: 'white',
  })

  node.append(frame)

  const setContent = () => {
    if (!frame.contentDocument) throw new Error('Cannot change frame content.')
    // We are injecting raw HTML in a sandboxed environnement,
    // no need to sanitize it
    // eslint-disable-next-line no-unsanitized/property
    frame.contentDocument.body.innerHTML = decryptedString
    // Make the frame as tall as its content
    frame.height = '1'
    frame.height = `${frame.contentDocument.body.scrollHeight + 20}`
  }

  setContent()

  // On Firefox the iframe empty itself on load so we have to fill it again
  frame.addEventListener('load', setContent)

  return frame
}

/** Adds a frame containing a QRCode. */
export const displayQREncryptedMail = (
  encryptedString: string,
  node: HTMLElement
): HTMLIFrameElement => {
  const frame = document.createElement('iframe')
  frame.id = 'iframe-id'

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
    document.querySelector('#iframe-id')?.remove()

    Object.assign(frame.style, {
      display: 'block',
      maxWidth: '100%',
      margin: '10px 0px',
      border: '2px solid #555',
      boxSizing: 'border-box',
      background: 'white',
    })

    node.append(frame)

    const setQrCode = () => {
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

      const FrameHeightWidth = Number.parseInt(height, 10) + 20

      frame.style.height = FrameHeightWidth.toString() + 'px'

      frame.style.width = FrameHeightWidth.toString() + 'px'
    }

    setQrCode()

    // On Firefox the iframe empty itself on load so we have to fill it again
    frame.addEventListener('load', setQrCode)
  }

  return frame
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
