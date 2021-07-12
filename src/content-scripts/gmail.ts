import { debug } from 'debug'
import { State } from 'report'
import DecryptButton from './DecryptButton.svelte'
import EncryptButton from './EncryptButton.svelte'
import {
  containsEncryptedText,
  decryptString,
  encryptString,
} from './encryption'

// Enable logging in the page console (not the extension console)
debug.enable('*')

/** Selectors for interesting HTML Elements of Gmail. */
const Selector = {
  MAIL_CONTENT: '.a3s.aiL',
  PLACEHOLDER: '.adf.ads',
  TOOLBAR: '.btx',
}

const FLAG = 'freemindtronicButtonAdded'

/** Add a button to a given element to decrypt `mailString`. */
const handleEncryptedMailElement = (mailElement: HTMLElement) => {
  if (FLAG in mailElement.dataset) return
  mailElement.dataset[FLAG] = '1'

  mailElement.style.overflow = 'visible'
  mailElement.style.position = 'relative'

  const treeWalker = document.createTreeWalker(
    mailElement,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (textNode: Text) =>
        textNode.data.trimStart().startsWith('AAAAF')
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP,
    }
  )

  let node = treeWalker.nextNode()
  while (node) {
    handleEncryptedString(node as Text)
    node = treeWalker.nextNode()
  }
}

// eslint-disable-next-line sonarjs/cognitive-complexity
function handleEncryptedString(node: Text) {
  const target = document.createElement('span')
  const button = new DecryptButton({ target })
  node.before(target)

  const encryptedString = node.parentNode?.textContent?.match(/AAAAF\S+/s)?.[0]
  if (!encryptedString) return

  button.$on('click', async () => {
    const decryptedString = await decryptString(encryptedString, (report) => {
      let tooltip = 'Loading...'
      if (report.state === State.SCAN_COMPLETE) {
        tooltip =
          report.found === 0
            ? 'Make sure your phone and your computer are on the same network.'
            : 'Trying to reach your phone...'
      } else if (report.state === State.NOTIFICATION_SENT) {
        tooltip = 'Click on the notification you received.'
      }

      button.$set({ tooltip })
    })

    const frame: HTMLIFrameElement = document.createElement('iframe')
    frame.style.display = 'block'
    frame.style.width = '100%'
    frame.style.maxWidth = '100%'
    frame.srcdoc = decryptedString
    frame.sandbox.value = ''
    node.parentNode?.append(frame)
    button.$set({ tooltip: undefined })
  })
}

// eslint-disable-next-line sonarjs/cognitive-complexity
const handleToolbar = (toolbar: HTMLElement) => {
  if (FLAG in toolbar.dataset) return
  toolbar.dataset[FLAG] = '1'

  const button = new EncryptButton({
    target: toolbar,
  })

  button.$on('click', async () => {
    const mail = toolbar
      .closest('.iN')
      ?.querySelector('[contenteditable] > :first-child')

    if (!mail || !mail.textContent) return

    // eslint-disable-next-line sonarjs/no-identical-functions
    mail.textContent = await encryptString(mail.textContent, (report) => {
      let tooltip = 'Loading...'
      if (report.state === State.SCAN_COMPLETE) {
        tooltip =
          report.found === 0
            ? 'Make sure your phone and your computer are on the same network.'
            : 'Trying to reach your phone...'
      } else if (report.state === State.NOTIFICATION_SENT) {
        tooltip = 'Click on the notification you received.'
      }

      button.$set({ tooltip })
    })

    button.$set({ tooltip: '' })
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
