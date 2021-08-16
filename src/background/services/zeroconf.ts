import type { TaskContext } from '$/task'
import debug from 'debug'
import { get } from 'svelte/store'
import { browser } from 'webextension-polyfill-ts'
import { sendRequest } from '$/legacy-code/network/exchange'
import { phones } from '$/phones'
import { Request } from '../protocol'

/** Registry name of the service. */
const APPLICATION_ID = 'com.freemindtronic.evidns'

/** Time (in ms) between two scans. */
const DEFAULT_COOLDOWN = 20_000

/** Minimum time between two scans, even if `scanFaster` is set to true. */
const MINIMUM_COOLDOWN = 0
// Set to 0 to address an issue with the Zeroconf service

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
 * Checks that the Zeroconf service is installed, and with a compatible version.
 *
 * @returns Whether the Zeroconf service is properly installed
 */
export const isZeroconfServiceInstalled = async (): Promise<boolean> => {
  const log = debug('service:zeroconf')

  try {
    const response = (await browser.runtime.sendNativeMessage(APPLICATION_ID, {
      cmd: 'Version',
    })) as { version: number } | undefined

    if (!response || !('version' in response)) return false

    // Print the version and check compatibility
    log(`Zeroconf version: ${response.version}.`)
    if (![1].includes(response.version)) {
      // The only compatible version is 1, update the array above
      // if more versions are suported
      // Note: `response.version` is the MAJOR version number
      console.error(
        `Zeroconf version ${response.version} is not compatible with this extension.`
      )
      return false
    }

    return true
  } catch (error: unknown) {
    console.error(error)
    return false
  }
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
  const log = debug('service:zeroconf')

  // Mark the service as started
  context.zeroconfRunning = true

  while (true) {
    const start = performance.now()

    // A promise to a list of connected devices
    const response = (await browser.runtime.sendNativeMessage(APPLICATION_ID, {
      cmd: 'Lookup',
      type: '_evitoken._tcp.',
    })) as ZeroconfResponse | undefined

    log('Scan results: %o', response?.result)

    if (response) await handleResponse(context, response)

    // Prune devices that haven't been seen for a while
    pruneOldDevices(context)

    // Avoid scan spamming
    const duration = performance.now() - start
    if (duration < MINIMUM_COOLDOWN) {
      await new Promise((resolve) => {
        setTimeout(resolve, MINIMUM_COOLDOWN - duration)
      })
    }

    if (context.scanFaster.get()) continue

    await Promise.race([
      context.scanFaster.observe(),
      new Promise((resolve) => {
        setTimeout(resolve, DEFAULT_COOLDOWN)
      }),
    ])
  }
}

/**
 * Updates the `context` with the `response`. If a new phone is found in the
 * response, it will be reached to get its name.
 */
const handleResponse = async (
  context: TaskContext,
  response: ZeroconfResponse
): Promise<void> => {
  const devicesFound =
    response.result?.map(({ a: ip, port }) => ({ ip, port })) ?? []

  // Parallelize all requests
  await Promise.allSettled(
    devicesFound.map(async ({ ip, port }) => {
      // If the device is not yet known, try to associate it with its certificate
      if (!context.network.has(ip)) await handleNewPhone(context, ip, port)

      // Update the `lastSeen` property of the phone
      const entry = context.network.get(ip)
      if (!entry) return

      entry.lastSeen = Date.now()

      if (entry.phone !== undefined) {
        entry.phone.store.update(($phone) => {
          $phone.lastSeen = Date.now()
          return $phone
        })
      }
    })
  )
}

/** Handles a phone seen for the first time. */
const handleNewPhone = async (
  context: TaskContext,
  ip: string,
  port: number
) => {
  const log = debug('zeroconf:handleNewPhone')
  // Send a "ping" to get the name of the phone
  const phone = await pingNewPhone(context, ip, port)

  // If it's not a paired phone, only register its port
  if (phone === undefined) {
    context.network.set(ip, { port, lastSeen: Date.now(), phone: undefined })
    log('New unpaired phone found at %o', ip)
    return
  }

  context.network.set(ip, {
    port,
    lastSeen: Date.now(),
    phone,
  })

  log('New phone found at %o (known as %o)', ip, get(phone.store).name)

  context.newDeviceFound.set()
}

/**
 * Tries to ping a phone to know if it's already saved.
 *
 * @returns Details about the phone, or `undefined` if it's not a paired phone.
 */
const pingNewPhone = async (context: TaskContext, ip: string, port: number) => {
  // Filter out phones that have already been found
  const $phones = new Set(get(phones))
  for (const { phone } of context.network.values())
    if (phone) $phones.delete(phone.store)

  // If 10 phones are paired with the extension, 10 requests will be sent to
  // the phone. This is far from optimal, but it's the best we can do with
  // the current protocol.
  for (const store of $phones) {
    const $phone = get(store)
    try {
      const pingResponse = await sendRequest({
        ip,
        port,
        type: Request.PING,
        data: { t: $phone.certificate.id },
        timeout: 2000,
      })

      // The phone answered with a 2xx code, that's the right phone
      return { store, keys: { pingResponse, date: Date.now() } }
    } catch {
      // The phone refused the connection, let's try the next certificate
    }
  }
}

/** Removes devices last seen a long time ago. */
const pruneOldDevices = (context: TaskContext) => {
  for (const [ip, { lastSeen }] of context.network.entries())
    if (Date.now() > lastSeen + 60 * 60 * 1000) context.network.delete(ip)
}
