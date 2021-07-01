/* eslint-disable unicorn/filename-case */
import {
  getZeroconfService,
  isZeroconfServiceInstalled,
  ZeroconfResponse,
} from './zeroconf-service'
import type { RequestMap, ResponseMap } from './protocol'
import { b64ToUint8Array } from './utils'
import Base64 from 'base64-arraybuffer'

/** @returns An HTTP address created from `ip`, `port` and `type` */
const formatURL = (ip: string, port: number, type = ''): string =>
  `http://${ip}:${port}${type}`

export interface WebAnswer {
  url: string
  data: unknown
  ip: string
  port: number
  origin: string
}

/**
 * Find devices on the local network, send them a pairing request and return the
 * device that accepted it.
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
 * Find devices on the local network, send them a pairing request and return the
 * device that accepted it.
 *
 * @remarks
 *   The difference with the function above is that this one only tries once.
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
      new Promise<void>((resolve) => {
        setTimeout(() => resolve(), timeOut)
      }),
    ])

    // Check it the request timed out
    if (devicesFound === undefined) {
      console.warn('Zeroconf timed out.')
      return
    }

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

      // Send the request to the device
      requestsSent.push(
        fetch(url, {
          method: 'POST',
          body: new URLSearchParams({ t: hash }),
          signal: controller.signal,
          mode: 'cors',
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
            port: requestPort,
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

export type Serialize<T> = {
  // eslint-disable-next-line no-unused-vars
  [K in keyof T]: string
}

export function serialize<T>(obj: T): Serialize<T> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      value instanceof Uint8Array ? Base64.encode(value) : value.toString(),
    ])
  ) as Serialize<T>
}

export type Unserialize<T> = {
  // eslint-disable-next-line no-unused-vars
  [K in keyof T]: Uint8Array
}

export function unserialize<T>(obj: T): Unserialize<T> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      typeof value === 'string' ? b64ToUint8Array(value) : value,
    ])
  ) as Unserialize<T>
}

export const sendRequest = async <T extends keyof RequestMap>({
  ip,
  port,
  type,
  data,
  timeout,
}: {
  ip: string
  port: number
  type: T
  data: RequestMap[T]
  timeout?: number // TODO re-introduce a default timeout
}): Promise<ResponseMap[T]> => {
  // Create an AbortController to trigger a timeout
  const controller = new AbortController()
  if (timeout) setTimeout(() => controller.abort(), timeout)

  // Send a POST request
  const response = await fetch(formatURL(ip, port, type), {
    method: 'POST',
    body: new URLSearchParams(serialize(data)),
    signal: controller.signal,
  })

  if (response.status >= 400) throw new Error(response.statusText)

  const responseData: Serialize<ResponseMap[T]> = await response.json()
  return unserialize(responseData) as unknown as ResponseMap[T]
}
