import { BrowserStore } from 'browser-store'
import { fetchKeys } from 'legacy-code/Client'
import { clientHello, PairingKey } from 'legacy-code/device'
import { EviCrypt } from 'legacy-code/EviCrypt'
import type { ReportDetails, ReporterImpl, StateKey } from 'legacy-code/report'
import {
  favoritePhone,
  favoritePhoneId,
  nextPhoneId,
  Phone,
  phones,
} from 'phones'
import { get } from 'svelte/store'
import type {
  BackgroundTask,
  ForegroundTask,
  InitialValue,
  MessageFromBackToFront,
  MessageFromFrontToBack,
  ReturnValue,
} from 'task'
import { browser, Runtime } from 'webextension-polyfill-ts'

/** Send an encryption request to the phone, return the encrypted text. */
// eslint-disable-next-line require-yield
const encrypt: BackgroundTask<string, never, string, never> = async function* (
  str,
  reporter,
  signal
) {
  await BrowserStore.allLoaded

  // Fetch the cerificate of the favorite phone in browser storage
  const phone = get(favoritePhone)

  if (phone === undefined) throw new Error('No favorite device set.')

  // Send a request to the FMT app
  const { keys, newCertificate } = await fetchKeys(phone.certificate, {
    reporter,
    signal,
  })
  phone.certificate = newCertificate
  phones.update(($phones) => $phones)

  // Encrypt the text
  const evi = new EviCrypt(keys)
  return evi.encryptText(str)
}

/** Send an decryption request to the phone, return the decrypted text. */
// eslint-disable-next-line require-yield
const decrypt: BackgroundTask<string, never, string, never> = async function* (
  str,
  reporter,
  signal
) {
  await BrowserStore.allLoaded

  // Fetch the cerificate of the favorite phone in browser storage
  const phone = get(favoritePhone)

  if (phone === undefined) throw new Error('No favorite device set.')

  // Send a request to the FMT app
  const { keys, newCertificate } = await fetchKeys(phone.certificate, {
    reporter,
    signal,
  })
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

export const Task = {
  ENCRYPT: 'encrypt',
  DECRYPT: 'decrypt',
  PAIR: 'pair',
} as const

export const TaskMap = {
  [Task.PAIR]: pair,
  [Task.ENCRYPT]: encrypt,
  [Task.DECRYPT]: decrypt,
} as const

browser.runtime.onConnect.addListener((port) => {
  switch (port.name) {
    case Task.PAIR:
      void startTask(pair, port)
      return
    case Task.ENCRYPT:
      void startTask(encrypt, port)
      return
    case Task.DECRYPT:
      void startTask(decrypt, port)
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
      console.log(state, details)
      if (!controller.signal.aborted)
        port.postMessage({ type: 'report', state, details })
    },
    controller.signal
  )
  port.onDisconnect.addListener(() => {
    controller.abort()
  })
  port.onMessage.addListener((message: MessageFromFrontToBack<typeof task>) => {
    if (message.type === 'abort') controller.abort()
  })
  let result = await generator.next()
  while (!result.done && !controller.signal.aborted) {
    port.postMessage({ type: 'request', request: result.value })

    // eslint-disable-next-line no-await-in-loop
    const message = await getMessage<MessageFromFrontToBack<typeof task>>(port)

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

export const runBackgroundTask = async <T extends keyof typeof TaskMap>(
  taskName: T,
  task: ForegroundTask<typeof TaskMap[T]>,
  initialValue: InitialValue<typeof TaskMap[T]>,
  report: ReporterImpl,
  signal: AbortSignal
): Promise<ReturnValue<typeof TaskMap[T]>> => {
  const generator = task()
  await generator.next()
  // eslint-disable-next-line sonarjs/cognitive-complexity
  return new Promise((resolve) => {
    const port = browser.runtime.connect({ name: taskName })
    signal.addEventListener('abort', () => {
      port.postMessage({ type: 'abort' })
    })
    port.onMessage.addListener(
      async (message: MessageFromBackToFront<typeof TaskMap[T]>) => {
        if (message.type === 'report') {
          report(message.state, message.details)
          return
        }

        if (message.type === 'request') {
          const result = await generator.next(message.request)
          if (result.done)
            console.warn('Generator exhausted, this is probably an error.')
          port.postMessage({ type: 'response', response: result.value })
          return
        }

        if (message.type === 'result') {
          resolve(message.result as ReturnValue<typeof TaskMap[T]>)
          port.disconnect()
          return
        }

        throw new Error('Unexpected message')
      }
    )
    port.postMessage(initialValue)
  })
}
