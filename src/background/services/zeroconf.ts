import debug from 'debug'
import { sendRequest } from 'legacy-code/lanUtils'
import { phones } from 'phones'
import { get } from 'svelte/store'
import type { TaskContext } from 'task'
import { browser } from 'webextension-polyfill-ts'
import { Request } from '../protocol'

const APPLICATION_ID = 'com.freemindtronic.evidns'

/** Time (in ms) between two scans. */
const DEFAULT_COOLDOWN = 20_000

/** Minimum time between two scans, even if `scanFaster` is set to true. */
const MINIMUM_COOLDOWN = 1000

/** A response object, sent by EviDNS v1. */
export interface ZeroconfResponse {
  /** Name of the service. */
  source: string
  /** Version of the service. */
  version: number
  /** List of devices found. */
  result: Array<{
    /** Unique identifier (UUIDv4). */
    name: string
    /** IP address. */
    a: string
    /** Reachable port. */
    port: number
    /** Hostname. */
    target: string
    /** An HTTP address produced with IP and port. */
    url: string
    /** Additional information. */
    txt: string[] | null
  }> | null
}

/**
 * Starts a persistent scanning service.
 *
 * @remarks
 *   This function returns instantaneously, but the promise returned never resolves.
 */
export const startZeroconfService = async (
  context: TaskContext
): Promise<never> => {
  const log = debug('zeroconf')

  if (!(await isZeroconfServiceInstalled()))
    throw new Error('Please install EviDNS.')

  while (true) {
    const start = performance.now()

    // A promise to a list of connected devices
    const response = (await browser.runtime.sendNativeMessage(APPLICATION_ID, {
      cmd: 'Lookup',
      type: '_evitoken._tcp.',
    })) as ZeroconfResponse | undefined

    log('Scan results: %o', response?.result)

    if (response) await handleResponse(context, response)

    // Avoid scan spamming
    const duration = performance.now() - start
    if (duration < MINIMUM_COOLDOWN)
      await new Promise((resolve) => {
        setTimeout(resolve, MINIMUM_COOLDOWN - duration)
      })

    if (context.scanFaster.get()) continue

    await Promise.race([
      context.scanFaster.observe(),
      new Promise((resolve) => {
        setTimeout(resolve, DEFAULT_COOLDOWN)
      }),
    ])
  }
}

/** @returns Whether the Zeroconf service is properly installed */
const isZeroconfServiceInstalled = async (): Promise<boolean> => {
  try {
    await browser.runtime.sendNativeMessage(APPLICATION_ID, { cmd: 'Version' })
    return browser.runtime.lastError === null
  } catch {
    return false
  }
}

/** Updates the `context` with the `response`. */
const handleResponse = async (
  context: TaskContext,
  response: ZeroconfResponse
): Promise<void> => {
  const log = debug('zeroconf:handleResponse')

  const devicesFound =
    response.result?.map(({ a: ip, port }) => ({ ip, port })) ?? []

  // Parallelize all requests
  await Promise.allSettled(
    devicesFound.map(async ({ ip, port }) => {
      // If the device is not yet known, try to associate it with its certificate
      if (!context.network.has(ip)) {
        // Send a "ping" to get the name of the phone
        const newPhone = await pingNewPhone(ip, port)

        // If it's not a paired phone, only register its port
        if (newPhone === undefined) {
          context.network.set(ip, { port })
          return
        }

        context.network.set(ip, {
          port,
          phone: newPhone.phone,
          keys: newPhone.keys,
        })

        log(
          'New device found at %o (known as %o)',
          ip,
          get(newPhone.phone).name
        )

        context.newDeviceFound.set()
      }

      // Update the `lastSeen` property of the phone
      const phone = context.network.get(ip)?.phone
      if (phone !== undefined) {
        phone.update(($phone) => {
          $phone.lastSeen = Date.now()
          return $phone
        })
      }
    })
  )
}

/** Tries to ping a phone to know if it's already saved. */
const pingNewPhone = async (ip: string, port: number) => {
  // Try all known phones, even those that have already been found
  // This could be improved by filtering out those that have already been found
  for (const phone of get(phones)) {
    const $phone = get(phone)
    try {
      const keys = await sendRequest({
        ip,
        port,
        type: Request.PING,
        data: { t: $phone.certificate.id },
        timeout: 2000,
      })

      // The phone answered with a 2xx code, that's the right phone
      return { phone, keys }
    } catch {
      // The phone refused the connection, let's try the next certificate
    }
  }
}
