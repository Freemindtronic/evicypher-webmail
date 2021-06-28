/* eslint-disable unicorn/filename-case */
import * as utils from './utils'
import {
  getZeroconfService,
  isZeroconfServiceInstalled,
  ZeroconfResponse,
} from './zeroconf-service'

/** @returns An HTTP address created from `ip` and `port` */
const formatURL = (ip: string, port: number): string => `http://${ip}:${port}`

export interface WebAnswer {
  url: string
  data: unknown
}

// eslint-disable-next-line max-params
export async function search(
  hash: string,
  type: string,
  signal: AbortSignal = new AbortController().signal,
  // eslint-disable-next-line unicorn/no-useless-undefined
  port: number | undefined = undefined,
  maxNumberOfSearches = 100
): Promise<WebAnswer> {
  // Try `maxNumberOfSearches` times to reach a phone
  while (maxNumberOfSearches > 0) {
    // Shall we continue?
    if (signal.aborted) throw new Error('Cancel by user.')

    // Run the search loop
    // eslint-disable-next-line no-await-in-loop
    const res = await searchLoop(hash, type, signal, port)
    if (res !== undefined) return res

    maxNumberOfSearches--
  }

  throw new Error('Too many tries.')
}

export async function searchLoop(
  hash: string,
  type: string,
  // eslint-disable-next-line default-param-last
  signal: AbortSignal = new AbortController().signal,
  PORT?: number
): Promise<undefined | WebAnswer> {
  if (!(await isZeroconfServiceInstalled())) {
    throw new Error('eviDNS not installed')
  }

  const nativePort = getZeroconfService()
  let asyncAddrs: string[] = []
  let asyncPort: number[] = []

  // A promise to a response of the Zeroconf Service
  const responded = new Promise<void>((resolve) => {
    nativePort.onMessage.addListener((response: ZeroconfResponse) => {
      asyncAddrs = []
      asyncPort = []

      for (const { a: ip, port } of response.result) {
        asyncAddrs.push(ip)
        asyncPort.push(port)
      }

      resolve()
    })
  })
  nativePort.postMessage({ cmd: 'Lookup', type: '_evitoken._tcp.' })

  let addrs: string[]
  let ports: number[]
  let flagLoop = true
  let result
  const refreshPeriod = 500
  const timeOut = 2500
  const awaitingResponce: string[] = []

  // Wait for either a response from EviDNS or a timeout
  await Promise.race([responded, utils.delay(timeOut)])

  const startTime = Date.now()

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

      // Create an AbortController to trigger a timeout
      const controller = new AbortController()
      setTimeout(() => {
        controller.abort()
      }, timeOut)

      // Try to reach the phone
      fetch(url, {
        method: 'POST',
        body: new URLSearchParams({ t: hash }),
        signal: controller.signal,
      })
        .then((response) => {
          if (response.status === 202) return response.json()
          if (response.status >= 400) throw new Error('Server error')
          throw new Error(
            `Device return wrong status number: ${response.status}`
          )
        })
        .then((data) => {
          nativePort.disconnect()
          flagLoop = false
          result = { url, data }
        })
        .catch(() => {
          utils.removeValueFromArray(awaitingResponce, url)
          console.warn('Connection failed, retrying in a few seconds.')
        })
    }

    // Wait a few milliseconds before retrying
    // eslint-disable-next-line no-await-in-loop
    await utils.delay(refreshPeriod)

    // Run for 5s then exit
    if (Date.now() - startTime > timeOut) {
      flagLoop = false
    }

    if (signal.aborted) {
      nativePort.disconnect()
      throwCancelError('Canceled by user')
    }
  }

  nativePort.disconnect()
  return result
}

// eslint-disable-next-line max-params
export function sendCipherADD(
  IP: string,
  PORT: number,
  iv: string,
  salt: string,
  hash: string
): Promise<Record<string, string>> {
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

async function sendPostRequest(
  url: string,
  data: Record<string, string>,
  timeout: number
): Promise<[Record<string, string>, string, number]> {
  // Create an AbortController to trigger a timeout
  const controller = new AbortController()
  setTimeout(() => {
    controller.abort()
  }, timeout)

  // Send a POST request
  return fetch(url, {
    method: 'POST',
    body: new URLSearchParams(data),
    signal: controller.signal,
  }).then(async (response) => {
    if (response.status >= 400) throw new Error(response.statusText)
    const data: Record<string, string> = await response.json()
    return [data, response.statusText, response.status]
  })
}

async function sendPostRequestData(
  url: string,
  payload: Record<string, string>,
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
  payload: Record<string, string>
): Promise<Record<string, string>> {
  return sendPostRequestData(url + type, payload, 180_000)
}

export function sendEnd(
  url: string,
  payload: Record<string, string>
): Promise<Record<string, string>> {
  return sendPostRequestData(url + '/f2', payload, 5000)
}

export function sendOk(
  url: string,
  data: string
): Promise<Record<string, string>> {
  const payload = { d: data }
  return sendPostRequestData(url + '/o', payload, 5000)
}

export function throwCancelError(s: string): never {
  const err = new Error(s)
  err.name = 'CancelError'
  throw err
}
