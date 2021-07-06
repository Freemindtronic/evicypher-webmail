import type { ReportDetails, ReporterImpl, StateKey } from 'legacy-code/report'
import { browser } from 'webextension-polyfill-ts'

export type State = string

export const Task = {
  ENCRYPT: 'encrypt',
  DECRYPT: 'decrypt',
  PAIR: 'pair',
} as const

export interface RequestMap {
  [Task.ENCRYPT]: string
  [Task.DECRYPT]: string
  [Task.PAIR]: string
}

export interface ResponseMap {
  [Task.ENCRYPT]: string
  [Task.DECRYPT]: string
  [Task.PAIR]: boolean
}

export interface MessageMap {
  [Task.ENCRYPT]:
    | { type: 'report'; value: State }
    | { type: 'response'; value: ResponseMap[typeof Task.ENCRYPT] }
  [Task.DECRYPT]:
    | { type: 'report'; value: State }
    | { type: 'response'; value: ResponseMap[typeof Task.DECRYPT] }
  [Task.PAIR]:
    | { type: 'report'; value: State }
    | { type: 'response'; value: ResponseMap[typeof Task.PAIR] }
}

export type ReportMessage<T extends StateKey> = {
  type: 'report'
  state: T
  details: T extends keyof ReportDetails ? ReportDetails[T] : undefined
}

export type MessageFromBackToFront =
  | {
      type: 'request'
      request: unknown
    }
  | {
      type: 'result'
      result: unknown
    }
  | ReportMessage<StateKey>

export type MessageFromFrontToBack =
  | {
      type: 'response'
      response: unknown
    }
  | { type: 'abort' }

export const backgroundTask = async <T extends typeof Task[keyof typeof Task]>(
  task: T,
  message: RequestMap[T],
  reporter: (state: State) => void
): Promise<ResponseMap[T]> =>
  new Promise((resolve) => {
    const port = browser.runtime.connect({ name: task })
    port.onMessage.addListener((message: MessageMap[T]) => {
      if (message.type === 'response') {
        resolve(message.value as ResponseMap[T])
        return
      }

      if (message.type === 'report') {
        reporter(message.value)
        return
      }

      throw new Error('Unexpected message')
    })
    port.postMessage(message)
  })

export const runBackgroundTask = async <
  T extends typeof Task[keyof typeof Task]
>(
  task: T,
  message: RequestMap[T],
  generator: AsyncGenerator<void | boolean, boolean>,
  report: ReporterImpl
): Promise<ResponseMap[T]> => {
  await generator.next()
  // eslint-disable-next-line sonarjs/cognitive-complexity
  return new Promise((resolve) => {
    const port = browser.runtime.connect({ name: task })
    port.onMessage.addListener(async (message: MessageFromBackToFront) => {
      if (message.type === 'report') {
        report(message.state, message.details)
        return
      }

      if (message.type === 'request') {
        const result = await generator.next(message.request)
        if (result.done)
          console.warn('Generator exhausted, this is probably an error.')
        port.postMessage({ type: 'response', response: result.value })
        return
      }

      if (message.type === 'result') {
        resolve(message.result as ResponseMap[T])
        port.disconnect()
        return
      }

      throw new Error('Unexpected message')
    })
    port.postMessage(message)
  })
}
