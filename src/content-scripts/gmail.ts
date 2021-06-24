import { browser } from 'webextension-polyfill-ts'
import DecryptButton from './DecryptButton.svelte'
import EncryptButton from './EncryptButton.svelte'

/** Send a request to the background script to encrypt the given string. */
export const encryptString = async (string: string): Promise<string> =>
  browser.runtime.sendMessage({
    type: 'encrypt-request',
    string,
  })

/** Send a request to the background script to decrypt the given string. */
const decryptString = async (string: string): Promise<string> =>
  browser.runtime.sendMessage({
    type: 'decrypt-request',
    string,
  })

/** Return whether the given string contains a known encryption header and footer. */
const containsEncryptedText = (string: string) => string.includes('AAAAF')

/** Return all encrypted messages found in a string. */
const extractEncryptedStrings = (string: string) => [
  ...(string.match(/AAAAF\S+/gs) || []),
]

/** Add a button to a given element to decrypt `mailString`. */
const handleEncryptedMailElement = (
  mailElement: HTMLElement,
  mailString: string
) => {
  if ('freemindtronicButtonAdded' in mailElement.dataset) return
  mailElement.dataset.freemindtronicButtonAdded = '1'

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
      decryptString(string).then((decryptedString) => {
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
  if ('freemindtronicButtonAdded' in toolbar.dataset) return
  toolbar.dataset.freemindtronicButtonAdded = '1'

  const button = new EncryptButton({
    target: toolbar,
  })

  button.$on('click', async () => {
    const mail = toolbar
      .closest('.iN')
      ?.querySelector('[contenteditable] > :first-child')
    if (!mail || !mail.textContent) return
    mail.textContent = await encryptString(mail.textContent)
  })
}

new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    // The user opens a mail
    if ((mutation.target as HTMLElement)?.classList.contains('aiL')) {
      const mailElement = mutation.target as HTMLElement
      const mailString = mailElement.textContent
      // If it's not an encrypted mail, ignore it
      if (mailString === null || !containsEncryptedText(mailString)) continue
      // `mailElement` contains an encrypted mail, let's add a button to decrypt it
      handleEncryptedMailElement(mailElement, mailString)
    }

    // The user starts writing a mail
    else if ((mutation.target as HTMLElement)?.classList.contains('bAK')) {
      const toolbar = mutation.target as HTMLElement
      handleToolbar(toolbar)
    }
  }
}).observe(document.body, {
  attributeFilter: ['class'],
  subtree: true,
  childList: true,
})
