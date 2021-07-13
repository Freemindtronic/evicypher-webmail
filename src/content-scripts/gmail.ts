import { debug } from 'debug'
import { Observable } from 'observable'
import { Report, State } from 'report'
import type { Writable } from 'svelte/store'
import DecryptButton from './DecryptButton.svelte'
import EncryptButton from './EncryptButton.svelte'
import {
  ButtonState,
  containsEncryptedText,
  decryptString,
  encryptString,
  extractEncryptedString,
  isEncryptedText,
} from './encryption'

// Enable logging in the page console (not the extension console)
if (process.env.NODE_ENV !== 'production') debug.enable('*')

/** Selectors for interesting HTML Elements of Gmail. */
const Selector = {
  MAIL_CONTENT: '.a3s.aiL',
  PLACEHOLDER: '.adf.ads',
  TOOLBAR: '.btx',
}

const FLAG = 'freemindtronicButtonAdded'

/** Adds a button to a given element to decrypt all encrypted parts found. */
const handleEncryptedMailElement = (mailElement: HTMLElement) => {
  // Mark the element
  if (FLAG in mailElement.dataset) return
  mailElement.dataset[FLAG] = '1'

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

  let node = treeWalker.nextNode()
  while (node) {
    // Add a "Decrypt" button next to the node
    if (!node.parentNode?.textContent) continue
    const encryptedString = extractEncryptedString(node.parentNode?.textContent)
    addDecryptButton(node as Text, encryptedString)
    node = treeWalker.nextNode()
  }
}

/** Adds a button next to the text node given. */
const addDecryptButton = (node: Text, encryptedString: string) => {
  // Add the button right before the beginning of the encrypted content
  const target = document.createElement('span')
  const button = new DecryptButton({ target })
  node.before(target)

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

  /** Frame containing the decrypted mail. */
  let frame: HTMLIFrameElement

  button.$on('click', async () => {
    if (state.get() === ButtonState.DONE) {
      frame.parentNode?.removeChild(frame)
      state.set(ButtonState.IDLE)
      return
    }

    // Prevent the process from running twice
    if (state.get() === ButtonState.IN_PROGRESS) return
    state.set(ButtonState.IN_PROGRESS)
    controller = new AbortController()

    // Decrypt and display
    const decryptedString = await startDecryption(
      encryptedString,
      state,
      button,
      controller.signal
    )

    if (decryptedString && node.parentNode)
      frame = displayDecryptedMail(decryptedString, node.parentNode)
  })
}

const startDecryption = async (
  encryptedString: string,
  state: Writable<ButtonState>,
  button: DecryptButton,
  signal: AbortSignal
) => {
  try {
    const decryptedString = await decryptString(
      encryptedString,
      reporter((tooltip: string) => {
        button.$set({ tooltip })
      }),
      signal
    )
    state.set(ButtonState.DONE)
    button.$set({ tooltip: undefined })
    return decryptedString
  } catch (error: unknown) {
    if (signal.aborted) return
    state.set(ButtonState.FAILED)
    if (error instanceof Error) button.$set({ tooltip: error.message })
  }
}

const reporter = (f: (tooltip: string) => void) => (report: Report) => {
  if (report.state === State.SCAN_COMPLETE) {
    f(
      report.found === 0
        ? 'Make sure your phone and your computer are on the same network.'
        : 'Trying to reach your phone...'
    )
  } else if (report.state === State.NOTIFICATION_SENT) {
    f('Click on the notification you received.')
  }
}

const displayDecryptedMail = (decryptedString: string, parent: ParentNode) => {
  const frame = document.createElement('iframe')
  Object.assign(frame.style, {
    display: 'block',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
  })
  frame.srcdoc = decryptedString
  frame.sandbox.value = ''
  parent.append(frame)
  return frame
}

// eslint-disable-next-line sonarjs/cognitive-complexity
const handleToolbar = (toolbar: HTMLElement) => {
  if (FLAG in toolbar.dataset) return
  toolbar.dataset[FLAG] = '1'

  const button = new EncryptButton({
    target: toolbar,
  })

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

  // eslint-disable-next-line complexity
  button.$on('click', async () => {
    // Prevent the process from running twice
    if (
      state.get() === ButtonState.DONE ||
      state.get() === ButtonState.IN_PROGRESS
    )
      return
    state.set(ButtonState.IN_PROGRESS)
    controller = new AbortController()

    // Retrieve the mail content
    const mail = toolbar.closest('.iN')?.querySelector('[contenteditable]')
    if (!mail || !mail.textContent) return

    try {
      // Encrypt and replace
      mail.textContent = await encryptString(
        mail.textContent,
        reporter((tooltip: string) => {
          button.$set({ tooltip })
        }),
        controller.signal
      )

      state.set(ButtonState.DONE)
    } catch (error: unknown) {
      if (controller.signal.aborted) return
      state.set(ButtonState.FAILED)
      if (error instanceof Error) button.$set({ tooltip: error.message })
    }
  })
}

// eslint-disable-next-line complexity, sonarjs/cognitive-complexity
new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    // The user opens a mail
    if ((mutation.target as HTMLElement)?.matches(Selector.MAIL_CONTENT)) {
      const mailElement = mutation.target as HTMLElement
      // If it's not an encrypted mail, ignore it
      const mailString = mailElement.textContent
      if (mailString === null || !containsEncryptedText(mailString)) continue
      // `mailElement` contains an encrypted mail, let's add a button to decrypt it
      handleEncryptedMailElement(mailElement)
      continue
    }

    // The user clicks on a "small" mail item
    if (
      (mutation.previousSibling as HTMLElement | null)?.matches(
        Selector.PLACEHOLDER
      )
    ) {
      const mailElement = (
        mutation.target as HTMLElement
      ).querySelector<HTMLElement>(Selector.MAIL_CONTENT)
      if (!mailElement) continue
      const mailString = mailElement.textContent
      // If it's not an encrypted mail, ignore it
      if (mailString === null || !containsEncryptedText(mailString)) continue
      // `mailElement` contains an encrypted mail, let's add a button to decrypt it
      handleEncryptedMailElement(mailElement)
      continue
    }

    // The user starts writing a mail
    if ((mutation.target as HTMLElement)?.matches(Selector.TOOLBAR)) {
      const toolbar = mutation.target as HTMLElement
      handleToolbar(toolbar)
    }
  }
}).observe(document.body, {
  subtree: true,
  childList: true,
})
