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
  }>
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
