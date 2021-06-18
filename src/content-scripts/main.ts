import { browser } from 'webextension-polyfill-ts'

/** Send a request to the background script to encrypt the given string. */
export const encryptString = async (string: string): Promise<string> => {
  return await browser.runtime.sendMessage({
    type: 'encrypt-request',
    string,
  })
}

/** Send a request to the background script to decrypt the given string. */
const decryptString = async (string: string): Promise<string> => {
  return await browser.runtime.sendMessage({
    type: 'decrypt-request',
    string,
  })
}

/** Return whether the given string contains a known encryption header and footer. */
const containsEncryptedText = (string: string) =>
  string.includes('===BEGIN ROT13===') && string.includes('===END ROT13===')

/** Return all encrypted messages found in a string. */
const extractEncryptedStrings = (string: string) =>
  [...(string.match(/===BEGIN ROT13===(.+?)===END ROT13===/gs) || [])].map(
    (x) => x.slice(17, -15)
  )

/** Add a button to a given element to decrypt `mailString`. */
const handleEncryptedMailElement = (
  mailElement: HTMLElement,
  mailString: string
) => {
  if ('freemindtronicButtonAdded' in mailElement.dataset) return
  mailElement.dataset.freemindtronicButtonAdded = '1'
  mailElement.style.position = 'relative'
  mailElement.style.outline = '3px solid orange'
  const button = createDecryptButton()
  mailElement.append(button)
  button.addEventListener(
    'click',
    () => {
      for (const string of extractEncryptedStrings(mailString)) {
        decryptString(string).then((decryptedString) => {
          const p: HTMLElement = document.createElement('p')
          p.textContent = decryptedString
          mailElement.append(p)
        })
      }
    },
    { once: true }
  )
}

/** Create an HTML button */
const createDecryptButton = () => {
  const button: HTMLButtonElement = document.createElement('button')
  button.type = 'button'
  button.style.all = 'revert'
  button.style.position = 'absolute'
  button.style.top = '0'
  button.style.right = '0'
  button.style.padding = '1em 2em'
  button.innerHTML = '🔓 Decrypt'
  return button
}

new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (
      mutation.type !== 'childList' ||
      !(mutation.target as HTMLElement)?.classList.contains('aiL')
    )
      continue
    const mailElement = mutation.target as HTMLElement
    const mailString = mailElement.textContent
    // If it's not an encrypted mail, ignore it
    if (mailString === null || !containsEncryptedText(mailString)) continue
    // `mailElement` contains an encrypted mail, let's add a button to decrypt it
    handleEncryptedMailElement(mailElement, mailString)
  }
}).observe(document.body, {
  attributeFilter: ['class'],
  subtree: true,
  childList: true,
})
