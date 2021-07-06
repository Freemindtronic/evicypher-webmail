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
  generator: AsyncGenerator<void | boolean, boolean, string>
): Promise<ResponseMap[T]> => {
  await generator.next()
  return new Promise((resolve) => {
    const port = browser.runtime.connect({ name: task })
    port.onMessage.addListener(async (message) => {
      const result = await generator.next(message)
      if (result.done) {
        resolve(result.value as ResponseMap[T])
        return
      }

      port.postMessage(result.value)
    })
    port.postMessage(message)
  })
}
