/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable complexity */
/**
 * Govern Andorra Full mode interface functions for content scripts.
 *
 * @module
 */

import type { Report } from '$/report'
import type { Selectors } from './common'
import { debug } from 'debug'
import tippy from 'tippy.js'
import { ErrorMessage, ExtensionError } from '$/error'
import { _ } from '$/i18n'
import QRCode from '../components/QRCode.svelte'
import DecryptButton from './DecryptButton.svelte'
import EncryptButton from './EncryptButton.svelte'
import QRCodeButton from './QRCodeButton.svelte'
import {
  FLAG,
  Options,
  addClickListener,
  containsEncryptedText,
  decryptString,
  displayDecryptedMail,
  encryptString,
  extractEncryptedString,
  isEncryptedText,
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
    const stringWithBrTags = encryptedString.slice(76, -9)
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

/** Adds an encryption button in the toolbar. */
const handleToolbar = (toolbar: HTMLElement, { design }: Options) => {
  const editor = document
    .querySelector('frame')
    ?.contentDocument?.querySelector('#e-contentpanel-container')
  console.log('editor', editor)
  const mail = document
    .querySelector('frame')
    ?.contentDocument?.querySelectorAll('iframe')[2]
    .contentDocument?.querySelector('body')
  console.log('mail', mail)
  const searchSendButton = document.querySelector('frame')?.contentDocument
  const sendButton = searchSendButton?.querySelector(
    '#e-actions-mailedit-send-text'
  )
  console.log('sendButton', sendButton)
  const auxnode = document.querySelector('frame')?.contentDocument
  const node = auxnode?.querySelectorAll('iframe[id$=editorframe]')
  console.log('node', node)

  if (!editor || !mail || !sendButton || !node) return
  console.log('AQUI NO HAY NADA NULL')
  console.log('TOLLBAR', toolbar)

  if (
    document
      .querySelector('frame')
      ?.contentDocument?.querySelector('#spanEncryptButton')
  )
    return

  console.log('AQUI NO HAY BANDERITA')

  toolbar.dataset[FLAG] = '1'
  const target = document.createElement('span')
  target.id = 'spanEncryptButton'
  target.style.display = 'contents'
  const button = new EncryptButton({
    target,
    props: { design },
  })

  for (const leaf of node) leaf.before(target)

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
    let encryptedString = await encryptString(
      // Use value of textarea
      mail.innerHTML,
      (report: Report) => {
        button.$set({ report })
      },
      signal
    )
    // Place the encrypted text un a preformatted text element
    encryptedString.replaceAll('\n', '<br>')
    encryptedString += '\r'
    mail.textContent = encryptedString
    tooltip.destroy()
  })
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
    const frame2 = frame1.querySelector('#iframeid')
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
  console.log('TOOOLBARS:', toolbar)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  for (const toolbar of toolbars!) {
    setTimeout(() => {
      handleToolbar(toolbar, options)
    }, 1000)
  }
}

/** Observes the DOM for changes. Should work for most webmails. */
export const observe = (options: Options): void => {
  // Run the listener on page load

  console.log('first handleMutation')
  handleMutations(options)
  // Start observing the DOM for changes
  new MutationObserver(() => {
    console.log('2nd handleMutation')
    handleMutations(options)

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  }).observe(document.querySelector('frame')!.contentDocument!, {
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
