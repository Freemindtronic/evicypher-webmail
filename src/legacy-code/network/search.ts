import type { RequestMap } from '../../background/protocol'
import type { TaskContext } from 'task'
import { ErrorMessage, ExtensionError } from 'error'
import { Reporter, State } from 'report'
import { sendRequest } from './exchange'

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
    signal,
    portOverride,
    maxNumberOfSearches = 100,
    reporter,
  }: {
    /** An AbortSignal to cancel any pending request. */
    signal: AbortSignal
    /** If set, ignore the connection port advertised by the devices. */
    portOverride?: number
    /** Max number of tries before aborting. */
    maxNumberOfSearches?: number
    /** A function to call every time the process advances. */
    reporter: Reporter
  }
): Promise<string> => {
  // Make the Zeroconf service run without cooldown
  context.scanFaster.set(true)

  try {
    // Try `maxNumberOfSearches` times to reach a phone
    while (maxNumberOfSearches > 0) {
      // Shall we continue?
      if (signal.aborted)
        throw new ExtensionError(ErrorMessage.CANCELED_BY_USER)

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

    throw new ExtensionError(ErrorMessage.TOO_MANY_ATTEMPTS)
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
    signal,
    portOverride,
    reporter,
  }: {
    /** An AbortSignal to cancel any pending request. */
    signal: AbortSignal
    /** If set, ignore the connection port advertised by the devices. */
    portOverride?: number
    /** A function to call every time the process advances. */
    reporter: Reporter
  }
): Promise<string | void> => {
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
  const requestsSent: Array<Promise<string>> = []
  for (const [ip, { port }] of devicesFound) {
    // If `portOverride` is set, ignore, the port found by Zeroconf
    const requestPort = portOverride ?? port

    const send = async () => {
      await sendRequest({
        ip,
        port: requestPort,
        type,
        data,
      })
      return ip
    }

    // Send the request to the device
    requestsSent.push(send())
  }

  try {
    // Wait for either a device to pair, or an AggregateError
    return await Promise.any(requestsSent)
  } catch {}
}
