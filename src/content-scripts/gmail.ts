import { debug } from 'debug'
import { Observable } from 'observable'
import { browser } from 'webextension-polyfill-ts'
import DecryptButton from './DecryptButton.svelte'
import EncryptButton from './EncryptButton.svelte'
import {
  ButtonState,
  containsEncryptedText,
  decryptString,
  encryptString,
  extractEncryptedString,
  isEncryptedText,
  reporter,
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

  addClickListener(button, async (state, signal) => {
    if (state.get() === ButtonState.DONE) {
      frame.parentNode?.removeChild(frame)
      return ButtonState.IDLE
    }

    state.set(ButtonState.IN_PROGRESS)
    button.$set({ tooltip: 'Loading...' })

    // Decrypt and display
    const decryptedString = await decryptString(
      encryptedString,
      reporter((tooltip: string) => {
        button.$set({ tooltip })
      }),
      signal
    )

    if (decryptedString && node.parentNode)
      frame = displayDecryptedMail(decryptedString, node.parentNode)

    return ButtonState.DONE
  })
}

/** Adds an encryption button in the toolbar. */
const handleToolbar = (toolbar: HTMLElement) => {
  if (FLAG in toolbar.dataset) return
  toolbar.dataset[FLAG] = '1'

  const button = new EncryptButton({
    target: toolbar,
  })

  addClickListener(button, async (state, signal) => {
    state.set(ButtonState.IN_PROGRESS)

    const mail = toolbar.closest('.iN')?.querySelector('[contenteditable]')
    if (!mail || !mail.textContent) throw new Error('Please write a mail.')

    button.$set({ tooltip: 'Loading...' })

    // Encrypt and replace
    mail.textContent = await encryptString(
      // Use innerHTML instead of textContent to support rich text
      mail.innerHTML,
      reporter((tooltip: string) => {
        button.$set({ tooltip })
      }),
      signal
    )

    return ButtonState.DONE
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
    state: Observable<ButtonState>,
    signal: AbortSignal
  ) => PromiseLike<ButtonState>
) => {
  /** Current state of the process. */
  const state = new Observable(ButtonState.IDLE)
  state.subscribe((state) => {
    // Reflect all changes to the button
    button.$set({ state })
  })

  /** Abort controller, bound to a button in the tooltip. */
  let controller: AbortController
  button.$on('abort', () => {
    controller.abort()
    state.set(ButtonState.IDLE)
  })

  // When the button is clicked, trigger the event listener
  button.$on('click', async () => {
    // Prevent the process from running twice
    if (state.get() === ButtonState.IN_PROGRESS) return
    controller = new AbortController()

    try {
      // Run the listener
      const newState = await listener(state, controller.signal)

      // Mark the job as done, or any other state returned by the listener
      state.set(newState)
      button.$set({ tooltip: undefined })
    } catch (error: unknown) {
      if (controller.signal.aborted) return

      // Mark the job as failed, and propagate the error message
      state.set(ButtonState.FAILED)
      if (error instanceof Error) button.$set({ tooltip: error.message })
    }
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
    if (!frame.contentDocument) throw new Error('Cannot change frame content')
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

  for (const mailElement of target.querySelectorAll<HTMLElement>(
    Selector.MAIL_CONTENT
  )) {
    handleMailElement(mailElement)
  }

  // The user starts writing a mail
  if (target.matches(Selector.TOOLBAR)) {
    handleToolbar(target)
  }
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
