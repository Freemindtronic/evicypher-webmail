/* eslint-disable unicorn/filename-case */
import type { RequestMap, ResponseMap } from '../background/protocol'
import { defaultReporter, Reporter, State } from '../report'
import type { TaskContext } from 'task'
import { fromUint8Array, toUint8Array } from 'js-base64'

/** @returns An HTTP address created from `ip`, `port` and `type` */
const formatURL = (ip: string, port: number, type = ''): string =>
  `http://${ip}:${port}${type}`

export interface WebAnswer<T> {
  url: string
  data: T
  ip: string
  port: number
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
export const search = async <T extends keyof RequestMap>(
  context: TaskContext,
  type: T,
  data: RequestMap[T],
  {
    signal = new AbortController().signal,
    portOverride,
    maxNumberOfSearches = 100,
    reporter = defaultReporter,
  }: {
    /** An AbortSignal to cancel any pending request. */
    signal?: AbortSignal
    /** If set, ignore the connection port advertised by the devices. */
    portOverride?: number
    /** Max number of tries before aborting. */
    maxNumberOfSearches?: number
    /** A function to call every time the process advances. */
    reporter?: Reporter
  } = {}
): Promise<WebAnswer<ResponseMap[T]>> => {
  // Make the Zeroconf service run without cooldown
  context.scanFaster.set(true)

  try {
    // Try `maxNumberOfSearches` times to reach a phone
    while (maxNumberOfSearches > 0) {
      // Shall we continue?
      if (signal.aborted) throw new Error('Cancelled by user.')

      // Run the search loop
      const res = await searchLoop(context, type, data, {
        signal,
        portOverride,
        reporter,
      })
      if (res !== undefined) return res

      await new Promise((resolve) => {
        setTimeout(resolve, 2000)
      })

      maxNumberOfSearches--
    }

    throw new Error('Too many tries.')
  } finally {
    context.scanFaster.set(false)
  }
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
const searchLoop = async <T extends keyof RequestMap>(
  context: TaskContext,
  type: T,
  data: RequestMap[T],
  {
    signal = new AbortController().signal,
    portOverride,
    reporter = defaultReporter,
  }: {
    /** An AbortSignal to cancel any pending request. */
    signal?: AbortSignal
    /** If set, ignore the connection port advertised by the devices. */
    portOverride?: number
    /** A function to call every time the process advances. */
    reporter?: Reporter
  } = {}
): Promise<WebAnswer<ResponseMap[T]> | void> => {
  // Connect to the Zeroconf/mDNS service locally installed
  const devicesFound = context.network

  reporter({ state: State.SCANNING, found: devicesFound.size })

  // Abort the operation if no device is found
  if (devicesFound.size === 0) return

  // Create an AbortController to trigger a timeout
  const controller = new AbortController()
  setTimeout(() => {
    controller.abort()
  }, 1000)
  signal.addEventListener('abort', () => {
    controller.abort()
  })

  // Try to reach all the devices found
  const requestsSent: Array<Promise<WebAnswer<ResponseMap[T]>>> = []
  for (const [ip, { port }] of devicesFound) {
    // If `portOverride` is set, ignore, the port found by Zeroconf
    const requestPort = portOverride ?? port

    // URL to send the request to
    const url = formatURL(ip, requestPort, type)

    const send = async () => {
      const responseData = await sendRequest({
        ip,
        port: requestPort,
        type,
        data,
      })
      return {
        url,
        data: responseData,
        ip,
        port: requestPort,
      }
    }

    // Send the request to the device
    requestsSent.push(send())
  }

  try {
    // Wait for either a device to pair, or an AggregateError
    return await Promise.any(requestsSent)
  } catch {}
}

export type Serialize<T> = {
  readonly [K in keyof T as T[K] extends Uint8Array ? K : never]: string
}

function serialize<T>(obj: T): Serialize<T> {
  return Object.fromEntries(
    Object.entries(obj)
      .filter<[string, Uint8Array]>(
        (value): value is [string, Uint8Array] => value[1] instanceof Uint8Array
      )
      .map(([key, value]) => [key, fromUint8Array(value)])
  ) as Serialize<T>
}

function unserialize<T>(obj: Serialize<T>): T {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      typeof value === 'string' ? toUint8Array(value) : value,
    ])
  ) as unknown as T
}

export const sendRequest = async <T extends keyof RequestMap>({
  ip,
  port,
  type,
  data,
  timeout,
  signal,
}: {
  ip: string
  port: number
  type: T
  data: RequestMap[T]
  timeout?: number // TODO re-introduce a default timeout
  signal?: AbortSignal
}): Promise<ResponseMap[T]> => {
  // Create an AbortController to trigger a timeout
  const controller = new AbortController()
  if (timeout)
    setTimeout(() => {
      controller.abort()
    }, timeout)
  if (signal?.aborted) throw new Error('Aborted before the request.')
  signal?.addEventListener('abort', () => {
    controller.abort()
  })

  // Send a POST request
  const response = await fetch(formatURL(ip, port, type), {
    method: 'POST',
    body: new URLSearchParams(serialize(data)),
    signal: controller.signal,
    mode: 'cors',
  })

  if (response.status >= 300) throw new Error(response.statusText)

  const responseData = (await response.json()) as Serialize<ResponseMap[T]>

  // @ts-expect-error For some mysterious reason, there is sometimes an
  // `n` field in the response, that contains a boolean (meaning "new"
  // or something), but stored as a string. Since it breaks unserialization
  // and it is not properly documented (ahah), we remove it.
  if ('n' in responseData) delete responseData.n

  return unserialize(responseData)
}
