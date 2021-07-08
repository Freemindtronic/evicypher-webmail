import type { TaskContext } from 'task'
import { browser, Runtime } from 'webextension-polyfill-ts'

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

/** Open a connection to the Zeroconf service. */
export const getZeroconfService = (): Runtime.Port =>
  browser.runtime.connectNative(APPLICATION_ID)

export const startZeroconfService = async (
  context: TaskContext
): Promise<never> => {
  while (true) {
    const nativePort = getZeroconfService()

    // A promise to a list of connected devices
    const zeroconfResponse = new Promise<Array<{ ip: string; port: number }>>(
      (resolve) => {
        const listener = (response: ZeroconfResponse) => {
          // Return an array of {ip, port}
          resolve(
            // The Zeroconf service returns `null` instead of an empty array
            response.result?.map(({ a: ip, port }) => ({ ip, port })) ?? []
          )
          nativePort.onMessage.removeListener(listener)
        }

        // Ask the service for a list of connected devices
        nativePort.onMessage.addListener(listener)
      }
    )

    nativePort.postMessage({ cmd: 'Lookup', type: '_evitoken._tcp.' })

    // eslint-disable-next-line no-await-in-loop
    const devicesFound = await zeroconfResponse
    nativePort.disconnect()

    for (const { ip, port } of devicesFound) {
      context.devices.set(ip, {
        port,
      })
    }
  }
}
