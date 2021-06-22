import type { Message } from 'messages'
import { browser } from 'webextension-polyfill-ts'

/** Basic ROT13 encryption. */
const encrypt = (str: string) => str
    .split('')
    .map((x) => {
      const i = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.indexOf(
        x
      )
      return i > -1
        ? 'NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm'[i]
        : x
    })
    .join('')

/** Basic ROT13 decryption. */
const decrypt = encrypt

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
