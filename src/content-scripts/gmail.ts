import type { Reporter } from 'report'
import { startBackgroundTask, Task } from 'task'
import DecryptButton from './DecryptButton.svelte'
import EncryptButton from './EncryptButton.svelte'

const Class = {
  MAIL_CONTENT: 'aiL',
  TOOLBAR: 'btx',
}

const FLAG = 'freemindtronicButtonAdded'

/** Send a request to the background script to encrypt the given string. */
const encryptString = async (
  string: string,
  report: Reporter,
  signal = new AbortController().signal
): Promise<string> =>
  startBackgroundTask(
    Task.ENCRYPT,
    async function* () {
      yield
      yield string
    },
    {
      report,
      signal,
    }
  )

/** Send a request to the background script to decrypt the given string. */
const decryptString = async (string: string): Promise<string> =>
  startBackgroundTask(
    Task.DECRYPT,
    async function* () {
      yield
      yield string
    },
    {
      report: (...args) => {
        console.log(...args)
      },
      signal: new AbortController().signal,
    }
  )

/** Return whether the given string contains a known encryption header and footer. */
const containsEncryptedText = (string: string) => string.includes('AAAAF')

/** Return all encrypted messages found in a string. */
const extractEncryptedStrings = (string: string) => [
  ...(string.match(/AAAAF\S+/gs) ?? []),
]

/** Add a button to a given element to decrypt `mailString`. */
const handleEncryptedMailElement = (
  mailElement: HTMLElement,
  mailString: string
) => {
  if (FLAG in mailElement.dataset) return
  mailElement.dataset[FLAG] = '1'

  mailElement.style.position = 'relative'
  mailElement.style.outline = '3px solid orange'

  const button = new DecryptButton({
    target: mailElement,
  })

  const encryptedString = extractEncryptedStrings(mailString)[0]

  button.$on('click', () => {
    void decryptString(encryptedString).then((decryptedString) => {
      const frame: HTMLIFrameElement = document.createElement('iframe')
      frame.srcdoc = decryptedString
      frame.sandbox.value = ''
      mailElement.append(frame)
    })
  })
}

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
    mail.textContent = await encryptString(mail.textContent, (state) => {
      button.$set({ state: state.state })
    })
  })
}

new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    // The user opens a mail
    if (
      (mutation.target as HTMLElement)?.classList.contains(Class.MAIL_CONTENT)
    ) {
      const mailElement = mutation.target as HTMLElement
      const mailString = mailElement.textContent
      // If it's not an encrypted mail, ignore it
      if (mailString === null || !containsEncryptedText(mailString)) continue
      // `mailElement` contains an encrypted mail, let's add a button to decrypt it
      handleEncryptedMailElement(mailElement, mailString)
    }

    // The user starts writing a mail
    else if (
      (mutation.target as HTMLElement)?.classList.contains(Class.TOOLBAR)
    ) {
      const toolbar = mutation.target as HTMLElement
      handleToolbar(toolbar)
    }
  }
}).observe(document.body, {
  attributeFilter: ['class'],
  subtree: true,
  childList: true,
})
