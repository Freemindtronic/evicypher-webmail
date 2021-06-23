/* eslint-disable unicorn/filename-case */
import { browser, Runtime } from 'webextension-polyfill-ts'
import { nativeMessagingApp } from './constants'

interface DNSAnwser {
  a: string
  name: string
  port: number
  target: string
  txt: string[]
  url: string
}

export interface NativeAnswer {
  result: DNSAnwser[]
}

export function getNativePort(): Runtime.Port {
  return browser.runtime.connectNative(nativeMessagingApp)
}

export function isNativeSupported(): Promise<boolean> {
  return new Promise((resolve) => {
    browser.runtime
      .sendNativeMessage(nativeMessagingApp, { cmd: 'Version' })
      .then(() => resolve(browser.runtime.lastError === undefined))
      .catch(() => resolve(false))
  })
}
