import { Client } from 'legacy-code/Client'
import { EviCrypt } from 'legacy-code/EviCrypt'
import { Settings } from 'legacy-code/Settings'
import type { Message } from 'messages'
import { browser } from 'webextension-polyfill-ts'

/** Send an encryption request to the phone, return the encrypted text. */
const encrypt = async (str: string) => {
  // Fetch the cerificate of the favorite phone in browser storage
  const device = await Settings.getFavorite()

  // Send a request to the FMT app
  const client = new Client()
  const keys = await client.requestKey(device)

  // Encrypt the text
  const evi = new EviCrypt(keys)
  const encrypted = evi.encryptText(str)

  return encrypted
}

/** Send an decryption request to the phone, return the decrypted text. */
const decrypt = async (str: string) => {
  // Fetch the cerificate of the favorite phone in browser storage
  const device = await Settings.getFavorite()

  // Send a request to the FMT app
  const client = new Client()
  const keys = await client.requestKey(device)

  // Decrypt the text
  const evi = new EviCrypt(keys)
  const decrypted = evi.decryptText(str)

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
