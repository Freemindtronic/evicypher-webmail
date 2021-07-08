import type { TaskContext } from 'task'
import { browser } from 'webextension-polyfill-ts'

const APPLICATION_ID = 'com.freemindtronic.evidns'

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

/** @returns Whether the Zeroconf service is properly installed. */
export const isZeroconfServiceInstalled = async (): Promise<boolean> => {
  try {
    await browser.runtime.sendNativeMessage(APPLICATION_ID, { cmd: 'Version' })
    return browser.runtime.lastError === null
  } catch {
    return false
  }
}

export const startZeroconfService = async (
  context: TaskContext
): Promise<never> => {
  if (!(await isZeroconfServiceInstalled()))
    throw new Error('Please install EviDNS.')

  while (true) {
    // A promise to a list of connected devices
    // eslint-disable-next-line no-await-in-loop
    const response = (await browser.runtime.sendNativeMessage(APPLICATION_ID, {
      cmd: 'Lookup',
      type: '_evitoken._tcp.',
    })) as ZeroconfResponse | undefined

    console.log('getZeroconfService', response)

    if (!response) continue

    const devicesFound =
      response.result?.map(({ a: ip, port }) => ({ ip, port })) ?? []

    for (const { ip, port } of devicesFound) {
      context.devices.set(ip, {
        port,
      })
    }
  }
}
