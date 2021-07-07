import { decrypt } from 'background/tasks/decrypt'
import { encrypt } from 'background/tasks/encrypt'
import { pair } from 'background/tasks/pair'
import type { ReportDetails, Reporter, ReporterImpl, StateKey } from 'report'
import { browser } from 'webextension-polyfill-ts'

export type ReportMessage<T extends StateKey> = {
  type: 'report'
  state: T
  details: T extends keyof ReportDetails ? ReportDetails[T] : undefined
}

export type MessageFromBackToFront<T> = T extends BackgroundTask<
  never,
  infer U,
  infer V,
  unknown
>
  ?
      | {
          type: 'request'
          request: U
        }
      | {
          type: 'result'
          result: V
        }
      | ReportMessage<StateKey>
  : never

export type MessageFromFrontToBack<T> = T extends BackgroundTask<
  never,
  unknown,
  unknown,
  infer U
>
  ?
      | {
          type: 'response'
          response: U
        }
      | { type: 'abort' }
  : never

/** A background task is an asynchronous generator piped with a foreground task. */
export type BackgroundTask<TInitialValue, TYielded, TReturn, TNext> = (
  initialValue: TInitialValue,
  reporter: Reporter,
  signal: AbortSignal
) => AsyncGenerator<TYielded, TReturn, TNext>

export type ForegroundTask<T> = T extends BackgroundTask<
  never,
  infer U,
  unknown,
  infer V
>
  ? () => AsyncGenerator<V, void, U>
  : never

/** Retreive the initial value from a background task. */
export type InitialValue<T> = T extends BackgroundTask<
  infer U,
  unknown,
  unknown,
  unknown
>
  ? U
  : never

/** Retreive the return value from a background task. */
export type ReturnValue<T> = T extends BackgroundTask<
  never,
  unknown,
  infer U,
  unknown
>
  ? U
  : never

export const Task = {
  ENCRYPT: 'encrypt',
  DECRYPT: 'decrypt',
  PAIR: 'pair',
} as const

export const TaskMap = {
  [Task.PAIR]: pair,
  [Task.ENCRYPT]: encrypt,
  [Task.DECRYPT]: decrypt,
} as const

export const runBackgroundTask = async <T extends keyof typeof TaskMap>(
  taskName: T,
  task: ForegroundTask<typeof TaskMap[T]>,
  initialValue: InitialValue<typeof TaskMap[T]>,
  report: ReporterImpl,
  signal: AbortSignal
): Promise<ReturnValue<typeof TaskMap[T]>> => {
  const generator = task()
  await generator.next()
  // eslint-disable-next-line sonarjs/cognitive-complexity
  return new Promise((resolve) => {
    const port = browser.runtime.connect({ name: taskName })
    signal.addEventListener('abort', () => {
      port.postMessage({ type: 'abort' })
    })
    port.onMessage.addListener(
      async (message: MessageFromBackToFront<typeof TaskMap[T]>) => {
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
          resolve(message.result as ReturnValue<typeof TaskMap[T]>)
          port.disconnect()
          return
        }

        throw new Error('Unexpected message')
      }
    )
    port.postMessage(initialValue)
  })
}
