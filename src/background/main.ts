import { BrowserStore } from 'browser-store'
import { fetchKeys } from 'legacy-code/Client'
import { EviCrypt } from 'legacy-code/EviCrypt'
import type { Message } from 'messages'
import { favoritePhone, phones } from 'phones'
import { get } from 'svelte/store'
import { browser } from 'webextension-polyfill-ts'

/** Send an encryption request to the phone, return the encrypted text. */
const encrypt = async (str: string) => {
  await BrowserStore.allLoaded

  // Fetch the cerificate of the favorite phone in browser storage
  const phone = get(favoritePhone)

  if (phone === undefined) throw new Error('No favorite device set.')

  // Send a request to the FMT app
  const { keys, newCertificate } = await fetchKeys(phone.certificate, {
    reporter: (x) => console.log(x),
  })
  phone.certificate = newCertificate
  phones.update((phones) => phones)

  // Encrypt the text
  const evi = new EviCrypt(keys)
  return evi.encryptText(str)
}

/** Send an decryption request to the phone, return the decrypted text. */
const decrypt = async (str: string) => {
  await BrowserStore.allLoaded

  // Fetch the cerificate of the favorite phone in browser storage
  const phone = get(favoritePhone)

  if (phone === undefined) throw new Error('No favorite device set.')

  // Send a request to the FMT app
  const { keys, newCertificate } = await fetchKeys(phone.certificate)
  phone.certificate = newCertificate
  phones.update((phones) => phones)

  // Decrypt the text
  const evi = new EviCrypt(keys)
  const decrypted = evi.decryptText(str)

  // A new certificate is created at the end of each exchange
  phones.update((phones) => phones)

  return decrypted
}

// Handle messages sent by content scripts
browser.runtime.onMessage.addListener(async (message: Message) => {
  if (
    message === null ||
    typeof message !== 'object' ||
    typeof message?.type !== 'string'
  )
    throw new Error(`Unexpected message ${message}`)

  switch (message.type) {
    case 'encrypt-request':
      return encrypt(message.string)
    case 'decrypt-request':
      return decrypt(message.string)
    default:
      throw new Error(`Unexpected message type ${(message as Message).type}`)
  }
})
