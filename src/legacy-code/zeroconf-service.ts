import { browser, Runtime } from 'webextension-polyfill-ts'

export interface ZeroconfResponse {
  result: Array<{
    a: string
    name: string
    port: number
    target: string
    txt: string[]
    url: string
  }>
}

const APPLICATION_ID = 'com.freemindtronic.evidns'

export const isZeroconfServiceInstalled = async (): Promise<boolean> => {
  try {
    await browser.runtime.sendNativeMessage(APPLICATION_ID, { cmd: 'Version' })
    return browser.runtime.lastError === null
  } catch {
    return false
  }
}

export const getZeroconfService = (): Runtime.Port =>
  browser.runtime.connectNative(APPLICATION_ID)
