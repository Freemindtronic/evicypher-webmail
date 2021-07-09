/* eslint-disable no-await-in-loop */
import type { TaskContext } from 'task'
import { browser } from 'webextension-polyfill-ts'
import debug from 'debug'

const APPLICATION_ID = 'com.freemindtronic.evidns'

/** Time (in ms) between two scans. */
const DEFAULT_COOLDOWN = 20_000

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

export const startZeroconfService = async (
  context: TaskContext
): Promise<never> => {
  const log = debug('zeroconf')

  if (!(await isZeroconfServiceInstalled()))
    throw new Error('Please install EviDNS.')

  while (true) {
    // A promise to a list of connected devices
    const response = (await browser.runtime.sendNativeMessage(APPLICATION_ID, {
      cmd: 'Lookup',
      type: '_evitoken._tcp.',
    })) as ZeroconfResponse | undefined

    log('Scan results: %o', response)

    if (response) handleResponse(context, response)

    if (context.scanFaster.get()) continue

    await Promise.race([
      context.scanFaster.observe(),
      new Promise((resolve) => {
        setTimeout(resolve, DEFAULT_COOLDOWN)
      }),
    ])
  }
}

/** @returns Whether the Zeroconf service is properly installed. */
const isZeroconfServiceInstalled = async (): Promise<boolean> => {
  try {
    await browser.runtime.sendNativeMessage(APPLICATION_ID, { cmd: 'Version' })
    return browser.runtime.lastError === null
  } catch {
    return false
  }
}

/** Updates the context with `response`. */
const handleResponse = (
  context: TaskContext,
  response: ZeroconfResponse
): void => {
  const devicesFound =
    response.result?.map(({ a: ip, port }) => ({ ip, port })) ?? []

  for (const { ip, port } of devicesFound) {
    context.devices.set(ip, {
      port,
    })
  }
}
