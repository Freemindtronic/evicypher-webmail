import { BrowserStore } from 'browser-store'
import { fetchKeys } from 'legacy-code/Client'
import { EviCrypt } from 'legacy-code/EviCrypt'
import { Task } from 'task'
import {
  favoritePhone,
  favoritePhoneId,
  nextPhoneId,
  Phone,
  phones,
} from 'phones'
import { get } from 'svelte/store'
import { browser, Runtime } from 'webextension-polyfill-ts'
import { clientHello, PairingKey } from 'legacy-code/device'

/** Send an encryption request to the phone, return the encrypted text. */
const encrypt = async (str: string, reporter: (message: string) => void) => {
  await BrowserStore.allLoaded

  // Fetch the cerificate of the favorite phone in browser storage
  const phone = get(favoritePhone)

  if (phone === undefined) throw new Error('No favorite device set.')

  // Send a request to the FMT app
  const { keys, newCertificate } = await fetchKeys(phone.certificate, {
    reporter,
  })
  phone.certificate = newCertificate
  phones.update(($phones) => $phones)

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
  return evi.decryptText(str)
}

const pair = async (phoneName: string, reporter: (message: string) => void) => {
  const pairingKey = new PairingKey()

  // Display the pairing QR code
  reporter(pairingKey.toString())

  // Wait for the user to scan the code
  const device = await clientHello(pairingKey)
  const key = await device.clientKeyExchange()

  // Show the UID
  console.log(key.UUID)

  // Send the confirmation request
  const certificate = await device.sendNameInfo(phoneName, key.ECC)
  const phone = new Phone(await nextPhoneId(), phoneName, certificate)

  phones.update(($phones) => [...$phones, phone])

  if (get(favoritePhone) === undefined) {
    favoritePhoneId.set(phone.id)
  }

  return true
}

interface DecryptRequest {
  type: 'decrypt-request'
  string: string
}

type Message = DecryptRequest

// Handle messages sent by content scripts
browser.runtime.onMessage.addListener(async (message: Message) => {
  if (
    message === null ||
    typeof message !== 'object' ||
    typeof message?.type !== 'string'
  )
    throw new Error(`Unexpected message ${message}`)

  // eslint-disable-next-line sonarjs/no-small-switch
  switch (message.type) {
    case 'decrypt-request':
      return decrypt(message.string)
    default:
      throw new Error(`Unexpected message type ${(message as Message).type}`)
  }
})

browser.runtime.onConnect.addListener((port) => {
  switch (port.name) {
    case Task.ENCRYPT:
      handleEncryption(port)
      return
    case Task.PAIR:
      handlePairing(port)
      return
    default:
      throw new Error('Unexpected connection.')
  }
})

/**
 * Returns a promise on the next message of the port. Throws if disconnected
 * before a message is received.
 */
const getMessage = async (port: Runtime.Port) =>
  new Promise((resolve, reject) => {
    const onMessage = (message: unknown) => {
      removeListeners()
      resolve(message)
    }

    const onDisconnect = () => {
      removeListeners()
      reject()
    }

    const removeListeners = () => {
      port.onMessage.removeListener(onMessage)
      port.onDisconnect.removeListener(onDisconnect)
    }

    port.onMessage.addListener(onMessage)
    port.onDisconnect.addListener(onDisconnect)
  })

async function handleEncryption(port: Runtime.Port) {
  const string = (await getMessage(port)) as string
  const response = await encrypt(string, (message) =>
    port.postMessage({ type: 'report', value: message })
  )
  port.postMessage({ type: 'response', value: response })
}

async function handlePairing(port: Runtime.Port) {
  const phoneName = (await getMessage(port)) as string
  const response = await pair(phoneName, (message) =>
    port.postMessage({ type: 'report', value: message })
  )
  port.postMessage({ type: 'response', value: response })
}
