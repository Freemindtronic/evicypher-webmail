/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable complexity */
/**
 * Govern Andorra functions for content scripts.
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
    const stringWithBrTags = encryptedString.slice(81, -13)
    // I treat the <br> and put \n
    // with this I avoid the foreground task formatting error
    const encryptedStringCorrected = stringWithBrTags.replaceAll('<br>', '\n')
    let encryptedStringCorrectedFinal = ''
    let x = 0
    for (x; x < encryptedStringCorrected.length; x++) {
      if (encryptedStringCorrected.charAt(x) === '\n') {
        encryptedStringCorrectedFinal += '\n'
        x++
      } else {
        encryptedStringCorrectedFinal += encryptedStringCorrected.charAt(x)
      }
    }

    // Decrypt and display
    return decryptString(
      encryptedStringCorrectedFinal,
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

  const frame = document.querySelector('frame')?.contentDocument
  if (!frame) return

  const iframe: NodeListOf<HTMLIFrameElement> | undefined =
    frame?.querySelectorAll('iframe[id$=editorframe]')
  if (!iframe) return

  const sendButton = frame.querySelector('#e-actions-mailedit-send-text')
  const node = frame.querySelectorAll('iframe[id$=editorframe]')

  if (!editor || !sendButton || !node) return

  toolbar.dataset[FLAG] = '1'
  const target = document.createElement('span')
  target.id = 'spanEncryptButton'
  target.style.display = 'contents'
  const button = new EncryptButton({
    target,
    props: { design },
  })

  // Loop to put the button in the iframe that does not have and has been opened
  // node is the collection of iframe
  for (const leaf of node) {
    if (!leaf.previousSibling) {
      let iframeID: RegExpMatchArray | null | undefined | string =
        leaf.id.match(/\d/g)
      iframeID = iframeID?.join('')

      target.id += iframeID

      leaf.before(target)

      const tooltip = tippy(sendButton, {
        theme: 'light-border',
      })
      _.subscribe(($_) => {
        tooltip.setContent($_('this-mail-is-not-encrypted'))
      })

      addClickListener(button, async (promise, resolved, rejected, signal) => {
        const mailAux: HTMLIFrameElement | null = frame?.querySelector(
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `#e-\\$new-${iframeID}-bodyrich-editorframe`
        )

        const mail = mailAux?.contentDocument?.body
        if (mail === undefined) return

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

        // Clear the textContent because i want it empty for the next steps
        mail.textContent = ''

        // TextContent of GovernAndorra is attached to the body, to the \n wont actually be there
        // So the solution i found is to make a hierarchy like most of normal webmails do
        const div = document.createElement('div')
        // Adding \r at the end solves the multiple responses problem
        encryptedString += '\r'
        // String needed to put the parts of the string in each part
        let encryptedStringFinal = ''
        let x = 0
        for (x; x < encryptedString.length; x++) {
          // When I find a \n I want to insert the actual string in the div and then place a br,
          // And clear the auxiliary string for the next parts
          if (encryptedString.charAt(x) === '\n') {
            encryptedStringFinal += encryptedString.charAt(x)
            div.append(encryptedStringFinal)
            const br = document.createElement('br')
            div.append(br)
            encryptedStringFinal = ''
          } else {
            // If is not a \n I just keep placing chars in the auxiliary string
            encryptedStringFinal += encryptedString.charAt(x)
          }
        }

        // Append the final div with all the br in the mail
        mail.append(div)
        tooltip.destroy()
      })
    }
  }
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const frame1 = document.querySelector('frame')!.contentDocument!.body
    const frame2 = frame1.querySelector('#iframe-id')
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

      const FrameHeightWidth = Number.parseInt(height, 10) + 20

      frame.style.height = FrameHeightWidth.toString() + 'px'

      frame.style.width = FrameHeightWidth.toString() + 'px'
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

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  for (const mail of mails!) handleMailElement(mail, options)

  // The user starts writing a mail
  const toolbars = frame1.contentDocument?.querySelectorAll<HTMLElement>(
    options.selectors.toolbar
  )
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

  handleMutations(options)
  // Start observing the DOM for changes
  new MutationObserver(() => {
    handleMutations(options)

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  }).observe(document.querySelector('frame')!.contentDocument!, {
    subtree: true,
    childList: true,
  })
}

/** Selectors for interesting HTML Elements of GovernAndorra. */
const selectors: Selectors = {
  mail: '.s-mailbody, .s-mailbody-preview',
  toolbar: '#e-toolbar',
  editor: '',
  editorContent: '',
  send: '',
}

// Function that injects the styles for the button to appear with all the styles
// I do this because the actual system has an error trying to fetch the source
// Of the styles
const injectCSS = (function () {
  return function () {
    // Entire css to be injected
    // !! NEEDS TO BE CHANGED, BECAUSE ITS VERY TEDIOUS IF YOU WANT TO PERFORM A CHANGE IN THE STYLES
    const css =
      ".tippy-box[data-theme~=light-border]{background-color:#fff;background-clip:padding-box;border:1px solid rgba(0,8,16,.15);color:#333;box-shadow:0 4px 14px -2px rgba(0,8,16,.08)}.tippy-box[data-theme~=light-border]>.tippy-backdrop{background-color:#fff}.tippy-box[data-theme~=light-border]>.tippy-arrow:after,.tippy-box[data-theme~=light-border]>.tippy-svg-arrow:after{content:'';position:absolute;z-index:-1}.tippy-box[data-theme~=light-border]>.tippy-arrow:after{border-color:transparent;border-style:solid}.tippy-box[data-theme~=light-border][data-placement^=top]>.tippy-arrow:before{border-top-color:#fff}.tippy-box[data-theme~=light-border][data-placement^=top]>.tippy-arrow:after{border-top-color:rgba(0,8,16,.2);border-width:7px 7px 0;top:17px;left:1px}.tippy-box[data-theme~=light-border][data-placement^=top]>.tippy-svg-arrow>svg{top:16px}.tippy-box[data-theme~=light-border][data-placement^=top]>.tippy-svg-arrow:after{top:17px}.tippy-box[data-theme~=light-border][data-placement^=bottom]>.tippy-arrow:before{border-bottom-color:#fff;bottom:16px}.tippy-box[data-theme~=light-border][data-placement^=bottom]>.tippy-arrow:after{border-bottom-color:rgba(0,8,16,.2);border-width:0 7px 7px;bottom:17px;left:1px}.tippy-box[data-theme~=light-border][data-placement^=bottom]>.tippy-svg-arrow>svg{bottom:16px}.tippy-box[data-theme~=light-border][data-placement^=bottom]>.tippy-svg-arrow:after{bottom:17px}.tippy-box[data-theme~=light-border][data-placement^=left]>.tippy-arrow:before{border-left-color:#fff}.tippy-box[data-theme~=light-border][data-placement^=left]>.tippy-arrow:after{border-left-color:rgba(0,8,16,.2);border-width:7px 0 7px 7px;left:17px;top:1px}.tippy-box[data-theme~=light-border][data-placement^=left]>.tippy-svg-arrow>svg{left:11px}.tippy-box[data-theme~=light-border][data-placement^=left]>.tippy-svg-arrow:after{left:12px}.tippy-box[data-theme~=light-border][data-placement^=right]>.tippy-arrow:before{border-right-color:#fff;right:16px}.tippy-box[data-theme~=light-border][data-placement^=right]>.tippy-arrow:after{border-width:7px 7px 7px 0;right:17px;top:1px;border-right-color:rgba(0,8,16,.2)}.tippy-box[data-theme~=light-border][data-placement^=right]>.tippy-svg-arrow>svg{right:11px}.tippy-box[data-theme~=light-border][data-placement^=right]>.tippy-svg-arrow:after{right:12px}.tippy-box[data-theme~=light-border]>.tippy-svg-arrow{fill:#fff}.tippy-box[data-theme~=light-border]>.tippy-svg-arrow:after{background-image:url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCA2czEuNzk2LS4wMTMgNC42Ny0zLjYxNUM1Ljg1MS45IDYuOTMuMDA2IDggMGMxLjA3LS4wMDYgMi4xNDguODg3IDMuMzQzIDIuMzg1QzE0LjIzMyA2LjAwNSAxNiA2IDE2IDZIMHoiIGZpbGw9InJnYmEoMCwgOCwgMTYsIDAuMikiLz48L3N2Zz4=);background-size:16px 6px;width:16px;height:6px}.tippy-box[data-animation=fade][data-state=hidden]{opacity:0}[data-tippy-root]{max-width:calc(100vw - 10px)}.tippy-box{position:relative;background-color:#333;color:#fff;border-radius:4px;font-size:14px;line-height:1.4;outline:0;transition-property:transform,visibility,opacity}.tippy-box[data-placement^=top]>.tippy-arrow{bottom:0}.tippy-box[data-placement^=top]>.tippy-arrow:before{bottom:-7px;left:0;border-width:8px 8px 0;border-top-color:initial;transform-origin:center top}.tippy-box[data-placement^=bottom]>.tippy-arrow{top:0}.tippy-box[data-placement^=bottom]>.tippy-arrow:before{top:-7px;left:0;border-width:0 8px 8px;border-bottom-color:initial;transform-origin:center bottom}.tippy-box[data-placement^=left]>.tippy-arrow{right:0}.tippy-box[data-placement^=left]>.tippy-arrow:before{border-width:8px 0 8px 8px;border-left-color:initial;right:-7px;transform-origin:center left}.tippy-box[data-placement^=right]>.tippy-arrow{left:0}.tippy-box[data-placement^=right]>.tippy-arrow:before{left:-7px;border-width:8px 8px 8px 0;border-right-color:initial;transform-origin:center right}.tippy-box[data-inertia][data-state=visible]{transition-timing-function:cubic-bezier(.54,1.5,.38,1.11)}.tippy-arrow{width:16px;height:16px;color:#333}.tippy-arrow:before{content:'';position:absolute;border-color:transparent;border-style:solid}.tippy-content{position:relative;padding:5px 9px;z-index:1}:global{@import '../assets/tippy';}.button {all: revert;:global(svg),:global(img) {vertical-align: bottom;}}.button.governandorra {margin: 8px 0;margin-right: 10px;padding: 4 7px;color: #000000;font-size: 12px;font-family: 'Helvetica, Arial', 'Segoe UI Semibold', 'Segoe WP Semibold','Segoe UI', 'Segoe WP', Tahoma, Arial, sans-serif;line-height: 2;background: rgba(0, 0, 0, 0) linear-gradient(rgb(249, 249, 249) 0%, rgb(226, 226, 226) 100%) repeat scroll 0% 0%;border: 1px solid rgb(200, 200, 200);border-radius: 0;cursor: pointer;&:focus {border-color: #bccad7;}&:hover {background-color: #bccad7;border-color: #39577a;}&.decrypt {margin: 8px 0;}&.encrypt {margin: 8px 0;float: left;} > :global(svg) {vertical-align: middle;}}svg {-webkit-transform: translateY(20%);}.tooltip {all: unset;display: flex;gap: 0.5em;align-items: center;width: max-content;max-width: 100%;font-family: system-ui, -apple-system, 'Segoe UI', 'Roboto', 'Ubuntu','Cantarell', 'Noto Sans', sans-serif;white-space: pre-line;> :global(button){flex-shrink: 0;}}"
    // Search for the iframe head to put the style we want
    const head = document
      .querySelector('frame')
      ?.contentDocument?.getElementsByTagName('head')[0]
    // Create a new element of style to put the css strings declared before
    const style = document.createElement('style')

    // Put the style element in the head of the iframe
    head?.appendChild(style)
    // Put type of style to be a text/css type content
    style.type = 'text/css'

    // Finally I append the string css to the style of the head that we already put before
    // eslint-disable-next-line unicorn/prefer-dom-node-append
    style.appendChild(document.createTextNode(css))
  }
})()
// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

setTimeout(() => {
  // Injects the string CSS in the iframe head style part of goverandorra-full
  injectCSS()
  observe({ selectors, design: Design.GovernAndorra })
}, 1000)
