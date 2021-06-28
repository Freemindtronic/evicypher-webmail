/* eslint-disable unicorn/filename-case */
import * as utils from './utils'
import {
  getZeroconfService,
  isZeroconfServiceInstalled,
  ZeroconfResponse,
} from './zeroconf-service'

/** @returns An HTTP address created from `ip`, `port` and `type` */
const formatURL = (ip: string, port: number, type: string): string =>
  `http://${ip}:${port}${type}`

export interface WebAnswer {
  url: string
  data: unknown
}

// eslint-disable-next-line max-params
export async function search(
  hash: string,
  type: string,
  signal: AbortSignal = new AbortController().signal,
  // eslint-disable-next-line unicorn/no-useless-undefined
  port: number | undefined = undefined,
  maxNumberOfSearches = 100
): Promise<WebAnswer> {
  // Check that the Zeroconf service is reachable
  if (!(await isZeroconfServiceInstalled()))
    throw new Error('Zeroconf service not installed.')

  // Try `maxNumberOfSearches` times to reach a phone
  while (maxNumberOfSearches > 0) {
    // Shall we continue?
    if (signal.aborted) throw new Error('Cancel by user.')

    // Run the search loop
    // eslint-disable-next-line no-await-in-loop
    const res = await searchLoop(hash, type, signal, port)
    if (res !== undefined) return res

    maxNumberOfSearches--
  }

  throw new Error('Too many tries.')
}

export async function searchLoop(
  hash: string,
  type: string,
  // eslint-disable-next-line default-param-last
  signal: AbortSignal = new AbortController().signal,
  portOverride?: number
): Promise<WebAnswer | void> {
  const nativePort = getZeroconfService()

  try {
    // A promise to a response of the Zeroconf Service
    const zeroconfResponse = new Promise<Array<[string, number]>>((resolve) => {
      // Get a list of connected devices
      nativePort.onMessage.addListener((response: ZeroconfResponse) => {
        const devicesFound: Array<[string, number]> = []

        for (const { a: ip, port } of response.result)
          devicesFound.push([ip, port])

        resolve(devicesFound)
      })
    })
    nativePort.postMessage({ cmd: 'Lookup', type: '_evitoken._tcp.' })

    // Wait for either a response or a timeout
    const timeOut = 2500
    const devicesFound = await Promise.race([
      zeroconfResponse,
      utils.delay(timeOut),
    ])

    // Check it the request timed out
    if (devicesFound === undefined) return

    console.log(`${devicesFound.length} devices found.`)

    // Abort the operation if no device is found
    if (devicesFound.length === 0) return

    // Create an AbortController to trigger a timeout
    const controller = new AbortController()
    setTimeout(() => controller.abort(), timeOut)
    signal.addEventListener('abort', () => controller.abort())

    // Try to reach all the devices found
    const requestsSent = []
    for (const [ip, port] of devicesFound) {
      // URL to send the request to
      // If `portOverride` is set, ignore, the port found by Zeroconf
      const url = formatURL(ip, portOverride ?? port, type)

      // We send the request to the device
      requestsSent.push(
        fetch(url, {
          method: 'POST',
          body: new URLSearchParams({ t: hash }),
          signal: controller.signal,
        })
          .then((response) => {
            // Accept responses that match "202 Accepted"
            if (response.status === 202) return response.json()
            throw new Error('The device refused the connection.')
          })
          .then((data) => ({ url, data })) // Resolve with url and data
          .catch() // Ignore errors
      )
    }

    // Wait for either a device to pair, or an AggregateError
    return await Promise.any(requestsSent)
  } catch {
    console.warn('No device accepted to pair.')
  } finally {
    // Properly disconnect
    nativePort.disconnect()
  }
}

// eslint-disable-next-line max-params
export function sendCipherADD(
  IP: string,
  PORT: number,
  iv: string,
  salt: string,
  hash: string
): Promise<Record<string, string>> {
  const url = formatURL(IP, PORT, '/c')
  const data = { t: hash, s: salt, i: iv }
  return sendPostRequestData(url, data, 60_000)
}

// eslint-disable-next-line max-params
export function sendName(
  IP: string,
  PORT: number,
  iv: string,
  salt: string,
  name: string
): Promise<[unknown, string, number]> {
  const url = formatURL(IP, PORT, '/n')
  const data = { n: name, s: salt, i: iv }
  return sendPostRequest(url, data, 5000)
}

async function sendPostRequest(
  url: string,
  data: Record<string, string>,
  timeout: number
): Promise<[Record<string, string>, string, number]> {
  // Create an AbortController to trigger a timeout
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeout)

  // Send a POST request
  return fetch(url, {
    method: 'POST',
    body: new URLSearchParams(data),
    signal: controller.signal,
  }).then(async (response) => {
    if (response.status >= 400) throw new Error(response.statusText)
    const data: Record<string, string> = await response.json()
    return [data, response.statusText, response.status]
  })
}

async function sendPostRequestData(
  url: string,
  payload: Record<string, string>,
  timeout: number
) {
  return sendPostRequest(url, payload, timeout).then(([data, , xhr]) => {
    if (xhr === 202) {
      return data
    }

    throw new Error('err')
  })
}

export function extractIP(url: string): string {
  // eslint-disable-next-line unicorn/prefer-string-slice
  return url.substring(7, url.lastIndexOf(':'))
}

export function extractURL(url: string): string {
  return url.slice(0, Math.max(0, url.lastIndexOf('/')))
}

export async function sendCipher(
  type: string,
  url: string,
  payload: Record<string, string>
): Promise<Record<string, string>> {
  return sendPostRequestData(url + type, payload, 180_000)
}

export function sendEnd(
  url: string,
  payload: Record<string, string>
): Promise<Record<string, string>> {
  return sendPostRequestData(url + '/f2', payload, 5000)
}

export function sendOk(
  url: string,
  data: string
): Promise<Record<string, string>> {
  const payload = { d: data }
  return sendPostRequestData(url + '/o', payload, 5000)
}

export function throwCancelError(s: string): never {
  const err = new Error(s)
  err.name = 'CancelError'
  throw err
}
