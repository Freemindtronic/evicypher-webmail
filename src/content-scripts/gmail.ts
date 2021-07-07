import { runBackgroundTask, Task } from 'background/main'
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
  reporter: (message: string) => void,
  signal = new AbortController().signal
): Promise<string> =>
  runBackgroundTask(
    Task.ENCRYPT,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    async function* () {},
    string,
    reporter,
    signal
  )

/** Send a request to the background script to decrypt the given string. */
const decryptString = async (string: string): Promise<string> =>
  runBackgroundTask(
    Task.DECRYPT,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    async function* () {},
    string,
    (...args) => {
      console.log(...args)
    },
    new AbortController().signal
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

  const encryptedStrings = [extractEncryptedStrings(mailString)[0]]

  let paragraphs: HTMLElement[] = []
  let toggle = true
  button.$on('click', () => {
    toggle = !toggle
    if (toggle) {
      for (const p of paragraphs) p.parentNode?.removeChild(p)
      paragraphs = []
      return
    }

    for (const string of encryptedStrings) {
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      void decryptString(string).then((decryptedString) => {
        const frame: HTMLIFrameElement = document.createElement('iframe')
        frame.srcdoc = decryptedString
        frame.sandbox.value = ''
        mailElement.append(frame)
        paragraphs.push(frame)
      })
    }
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
      button.$set({ state })
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
