/* eslint-disable unicorn/filename-case */
import * as utils from './utils'
import {
  getZeroconfService,
  isZeroconfServiceInstalled,
  ZeroconfResponse,
} from './zeroconf-service'

/** @returns An HTTP address created from `ip`, `port` and `type` */
const formatURL = (ip: string, port: number, type = ''): string =>
  `http://${ip}:${port}${type}`

export interface WebAnswer {
  url: string
  data: unknown
  ip: string
  origin: string
}

/**
 * Find devices on the local network and send them a pairing request.
 *
 * @param hash - Pairing payload
 * @param type - Type of pairing request
 * @returns The URL and the pairing response of the device
 * @throws {Error} If the maximum number of tries is reached, if the operation
 *   is aborted or if the Zeroconf service is not properly installed
 */
export const search = async (
  hash: string,
  type: string,
  {
    signal = new AbortController().signal,
    portOverride,
    maxNumberOfSearches = 100,
  }: {
    /** An AbortSignal to cancel any pending request. */
    signal?: AbortSignal
    /** If set, ignore the connection port advertised by the devices. */
    portOverride?: number
    /** Max number of tries before aborting. */
    maxNumberOfSearches?: number
  } = {}
): Promise<WebAnswer> => {
  // Check that the Zeroconf service is reachable
  if (!(await isZeroconfServiceInstalled()))
    throw new Error('Zeroconf service not installed.')

  // Try `maxNumberOfSearches` times to reach a phone
  while (maxNumberOfSearches > 0) {
    // Shall we continue?
    if (signal.aborted) throw new Error('Cancel by user.')

    // Run the search loop
    // eslint-disable-next-line no-await-in-loop
    const res = await searchLoop(hash, type, { signal, portOverride })
    if (res !== undefined) return res

    maxNumberOfSearches--
  }

  throw new Error('Too many tries.')
}

/**
 * Find devices on the local network and send them a pairing request.
 *
 * @param hash - Pairing payload
 * @param type - Type of pairing request
 * @returns A promise with the pairing response, if any, or undefined if all
 *   devices refused the connection
 */
const searchLoop = async (
  hash: string,
  type: string,
  {
    signal = new AbortController().signal,
    portOverride,
  }: {
    /** An AbortSignal to cancel any pending request. */
    signal?: AbortSignal
    /** If set, ignore the connection port advertised by the devices. */
    portOverride?: number
  } = {}
): Promise<WebAnswer | void> => {
  // Connect to the Zeroconf/mDNS service locally installed
  const nativePort = getZeroconfService()

  try {
    // A promise to a list of connected devices
    const zeroconfResponse = new Promise<Array<{ ip: string; port: number }>>(
      (resolve) => {
        // Ask the service for a list of connected devices
        nativePort.onMessage.addListener((response: ZeroconfResponse) => {
          // Return an array of {ip, port}
          resolve(response.result.map(({ a: ip, port }) => ({ ip, port })))
        })
      }
    )
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
    for (const { ip, port } of devicesFound) {
      // If `portOverride` is set, ignore, the port found by Zeroconf
      const requestPort = portOverride ?? port

      // URL to send the request to
      const url = formatURL(ip, requestPort, type)

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
          .then((data) => ({
            url,
            data,
            ip,
            origin: formatURL(ip, requestPort),
          })) // Resolve with url and data
          .catch() // Ignore connection errors
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
