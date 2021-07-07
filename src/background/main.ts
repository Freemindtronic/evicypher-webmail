import { BrowserStore } from 'browser-store'
import { fetchKeys } from 'legacy-code/Client'
import { EviCrypt } from 'legacy-code/EviCrypt'
import { BackgroundTask, MessageFromFrontToBack, Task } from 'task'
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
import type { ReportDetails, StateKey } from 'legacy-code/report'

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

export const pair: BackgroundTask<
  { phoneName: string },
  string,
  boolean,
  boolean | undefined
> = async function* ({ phoneName }, reporter, signal) {
  const pairingKey = new PairingKey()

  // Send the pairing QR code
  yield pairingKey.toString()

  // Wait for the user to scan the code
  const device = await clientHello(pairingKey, signal, reporter)
  const key = await device.clientKeyExchange()

  // Send the UID
  const confirmation = yield key.UUID

  // Wait for the confirmation
  if (!confirmation) return false

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
    throw new Error(`Unexpected message ${typeof message}`)

  // eslint-disable-next-line sonarjs/no-small-switch
  switch (message.type) {
    case 'decrypt-request':
      return decrypt(message.string)
    default:
      throw new Error(`Unexpected message type ${message.type as string}`)
  }
})

browser.runtime.onConnect.addListener((port) => {
  switch (port.name) {
    case Task.ENCRYPT:
      void handleEncryption(port)
      return
    case Task.PAIR:
      void startTask(pair, port)
      return
    default:
      throw new Error('Unexpected connection.')
  }
})

/**
 * Returns a promise on the next message of the port. Throws if disconnected
 * before a message is received.
 */
const getMessage = async <T = unknown>(port: Runtime.Port) =>
  new Promise<T>((resolve, reject) => {
    const onMessage = (message: T) => {
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
  const string = await getMessage<string>(port)
  const response = await encrypt(string, (message) => {
    port.postMessage({ type: 'report', value: message })
  })
  port.postMessage({ type: 'response', value: response })
}

// eslint-disable-next-line sonarjs/cognitive-complexity
async function startTask<T, U, V, W>(
  task: BackgroundTask<T, V, U, W>,
  port: Runtime.Port
) {
  const controller = new AbortController()
  const initialValue = await getMessage<T>(port)
  const generator = task(
    initialValue,
    (state: StateKey, details?: ReportDetails[keyof ReportDetails]) => {
      if (!controller.signal.aborted)
        port.postMessage({ type: 'report', state, details })
    },
    controller.signal
  )
  port.onDisconnect.addListener(() => {
    controller.abort()
  })
  port.onMessage.addListener((message: MessageFromFrontToBack<W>) => {
    if (message.type === 'abort') controller.abort()
  })
  let result = await generator.next()
  while (!result.done && !controller.signal.aborted) {
    port.postMessage({ type: 'request', request: result.value })

    // eslint-disable-next-line no-await-in-loop
    const message = await getMessage<MessageFromFrontToBack<W>>(port)

    if (message.type === 'response') {
      // eslint-disable-next-line no-await-in-loop
      result = await generator.next(message.response)
      continue
    }

    if (message.type === 'abort') {
      // Abort requests are handled above, no need to handle them twice
      continue
    }

    throw new Error(`Message received: ${message as string}`)
  }

  if (result.done) port.postMessage({ type: 'result', result: result.value })
}
