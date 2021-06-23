/* eslint-disable unicorn/filename-case */
import $ from 'jquery'

import { PromiseManager } from './PromiseManager'
import {
  getNativePort,
  isNativeSupported,
  NativeAnswer,
} from './nativeMessaging'
import * as utils from './utils'

export const apiProtocol = 'http://'
export const json = 'json'
export const POST = 'POST'

class ErrorTimeOut extends Error {}

export interface WebAnswer {
  url: string
  data: unknown
}

interface lanCallback {
  hasStop: () => boolean
}

// eslint-disable-next-line max-params
export async function search(
  hash: string,
  type: string,
  callback: lanCallback,
  PORT?: number,
  n?: number
): Promise<undefined | WebAnswer> {
  n = n === undefined ? 0 : n + 1
  if (callback.hasStop()) {
    throwCancelError('Canceled by user')
  }

  return searchLoop(hash, type, callback, PORT).then((res) => {
    if (res !== undefined) {
      return res
    }

    if ((n as number) < 100) {
      return search(hash, type, callback, PORT, n)
    }

    throw new ErrorTimeOut('TimeOut')
  })
}

export async function searchByIP(
  IPs: string[],
  PORT: number,
  hash: string,
  type: string
): Promise<undefined | WebAnswer> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    let flagLoop = true
    const refreshPeriod = 500
    const timeOut = 60_000
    const awaitingResponce: string[] = []

    const startTime = Date.now()

    // Loop addresses with a cooldown of refreshPeriod (ms)
    while (flagLoop) {
      console.log('inLoop', IPs, awaitingResponce, flagLoop)

      for (const ip of IPs) {
        const url = formatURL(ip, PORT) + type

        // Do not send new request to the one that did not responded yet
        if (awaitingResponce.includes(url)) continue
        awaitingResponce.push(url)

        sendPostRequest(url, { t: hash }, 2500)
          .then(([data, textStatus, xhr]) => {
            if (xhr === 202) {
              flagLoop = false
              resolve({ url, data })
            } else {
              reject(textStatus)
            }
          })
          .catch(() => {
            utils.removeValueFromArray(awaitingResponce, url)
          })
      }

      const deltaT = refreshPeriod - ((Date.now() - startTime) % refreshPeriod)
      if (deltaT > 0) {
        // eslint-disable-next-line no-await-in-loop
        await utils.delay(deltaT)
      }

      // Run for 5s then exit
      if (Date.now() - startTime > timeOut) {
        flagLoop = false
      }
    }
  })
}

export async function searchByIPv2(
  IPs: string[],
  PORT: number,
  hash: string,
  type: string
): Promise<undefined | WebAnswer> {
  let flagLoop = true
  let result
  const refreshPeriod = 500
  const timeOut = 2500
  const awaitingResponce: string[] = []
  const promiseMng = new PromiseManager()

  const startTime = Date.now()

  await promiseMng.getPromiseWithTimeout(timeOut)

  // Loop addresses with a cooldown of refreshPeriod (ms)
  while (flagLoop) {
    console.log('inLoop', IPs, awaitingResponce)

    for (const IP of IPs) {
      const url = formatURL(IP, PORT) + type

      // Do not send new request to the one that did not responded yet
      if (awaitingResponce.includes(url)) continue
      awaitingResponce.push(url)

      sendPostRequest(url, { t: hash }, 2500)
        .then(([data, textStatus, xhr]) => {
          if (xhr === 202) {
            flagLoop = false
            result = { url, data }
          } else {
            throw new Error(textStatus)
          }
        })
        .catch(() => {
          utils.removeValueFromArray(awaitingResponce, url)
        })
    }

    const deltaT = refreshPeriod - ((Date.now() - startTime) % refreshPeriod)
    // eslint-disable-next-line no-await-in-loop
    await promiseMng.getPromiseWithTimeout(deltaT)
    // Run for 5s then exit
    if (Date.now() - startTime > timeOut) {
      flagLoop = false
    }
  }

  return result
}

export async function searchLoop(
  hash: string,
  type: string,
  callback: lanCallback,
  PORT?: number
): Promise<undefined | WebAnswer> {
  let addrs: string[]
  let ports: number[]
  let asyncAddrs: string[] = []
  let asyncPort: number[] = []
  let flagLoop = true
  let result
  const refreshPeriod = 500
  const timeOut = 2500
  const awaitingResponce: string[] = []
  const promiseMng = new PromiseManager()

  if (!(await isNativeSupported())) {
    throw new Error('eviDNS not installed')
  }

  const nativePort = getNativePort()
  nativePort.onMessage.addListener((response: NativeAnswer) => {
    const tempAddr: string[] = []
    const tempPort: number[] = []
    for (let i = 0; i < response.result.length; i++) {
      tempAddr.push(response.result[i].a)
      tempPort.push(response.result[i].port)
    }

    asyncAddrs = [...tempAddr]
    asyncPort = [...tempPort]
    promiseMng.resolve()
  })
  nativePort.postMessage({ cmd: 'Lookup', type: '_evitoken._tcp.' })

  const startTime = Date.now()

  await promiseMng.getPromiseWithTimeout(timeOut)

  // Loop addresses with a cooldown of refreshPeriod (ms)
  while (flagLoop) {
    addrs = [...asyncAddrs]
    ports = [...asyncPort]

    console.log('inLoop', addrs, awaitingResponce)

    for (const [i, addr] of addrs.entries()) {
      const port = PORT === undefined ? ports[i] : PORT
      const url = formatURL(addr, port) + type

      // Do not send new request to the one that did not responded yet
      if (awaitingResponce.includes(url)) continue
      awaitingResponce.push(url)

      $.ajax({
        dataType: json,
        type: POST,
        url,
        data: { t: hash },
        timeout: 2500,
        success: (data, _textStatus, xhr) => {
          if (xhr.status === 202) {
            nativePort.disconnect()
            flagLoop = false
            result = { url, data }
          } else {
            throw new Error(`Device return wrong status number: ${xhr.status}`)
          }
        },
        error: (XMLHttpRequest) => {
          utils.removeValueFromArray(awaitingResponce, url)
          if (XMLHttpRequest.status !== 409) {
            // Console.log(`Wrong status number: ${XMLHttpRequest.status}`);
          }
        },
      })
    }

    const deltaT = refreshPeriod - ((Date.now() - startTime) % refreshPeriod)
    // eslint-disable-next-line no-await-in-loop
    await promiseMng.getPromiseWithTimeout(deltaT)
    // Run for 5s then exit
    if (Date.now() - startTime > timeOut) {
      flagLoop = false
    }

    if (callback.hasStop()) {
      nativePort.disconnect()
      throwCancelError('Canceled by user')
    }
  }

  nativePort.disconnect()
  return result
}

export function formatURL(ip: string, port: number): string {
  return apiProtocol + ip + ':' + port
}

// eslint-disable-next-line max-params
export function sendCipherADD(
  IP: string,
  PORT: number,
  iv: string,
  salt: string,
  hash: string
): Promise<unknown> {
  const url = formatURL(IP, PORT) + '/c'
  const data = { t: hash, s: salt, i: iv }
  return sendPostRequestData(url, data, 60_000)
}

// eslint-disable-next-line max-params
export function sendName(
  IP: string,
  PORT: number,
  iv: string,
  salt: string,
  name: string
): Promise<[unknown, string, number]> {
  const url = formatURL(IP, PORT) + '/n'
  const data = { n: name, s: salt, i: iv }
  return sendPostRequest(url, data, 5000)
}

function sendPostRequest(
  url: string,
  data: unknown,
  timeout: number
): Promise<[unknown, string, number]> {
  return new Promise((resolve, reject) => {
    $.ajax({
      dataType: json,
      type: POST,
      url,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
      timeout,
      success: (data, _textStatus, xhr) => {
        resolve([data, xhr.statusText, xhr.status])
      },
      error: (_xhr, _textStatus, error) => {
        reject(error)
      },
    })
  })
}

async function sendPostRequestData(
  url: string,
  payload: unknown,
  timeout: number
) {
  return sendPostRequest(url, payload, timeout).then(([data, , xhr]) => {
    if (xhr === 202) {
      return data
    }

    throw new Error('err')
  })
}

export function extractIP(url: string): string {
  // eslint-disable-next-line unicorn/prefer-string-slice
  return url.substring(7, url.lastIndexOf(':'))
}

export function extractURL(url: string): string {
  return url.slice(0, Math.max(0, url.lastIndexOf('/')))
}

export async function sendCipher(
  type: string,
  url: string,
  payload: unknown
): Promise<unknown> {
  return sendPostRequestData(url + type, payload, 180_000)
}

export function sendEnd(url: string, payload: unknown): Promise<unknown> {
  return sendPostRequestData(url + '/f2', payload, 5000)
}

export function sendOk(url: string, data: string): Promise<unknown> {
  const payload = { d: data }
  return sendPostRequestData(url + '/o', payload, 5000)
}

export function throwCancelError(s: string): never {
  const err = new Error(s)
  err.name = 'CancelError'
  throw err
}
