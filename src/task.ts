import { decrypt } from 'background/tasks/decrypt'
import { encrypt } from 'background/tasks/encrypt'
import { pair } from 'background/tasks/pair'
import type { ReportDetails, Reporter, ReporterImpl, StateKey } from 'report'
import { browser } from 'webextension-polyfill-ts'

/**
 * A background task is an asynchronous generator transparently connected to a
 * foreground task. The `yield` keyword is used to exchange data between them.
 *
 * @typeParam TInitialValue - Type of the data required to start the task
 * @typeParam TYielded - Type of the data sent to the foreground task
 * @typeParam TReturn - Type of the data used as a return value to
 *   {@link runBackgroundTask}
 * @typeParam TNext - Type of the data received from the foreground task
 */
export type BackgroundTask<TInitialValue, TYielded, TReturn, TNext> = (
  initialValue: TInitialValue,
  reporter: Reporter,
  signal: AbortSignal
) => AsyncGenerator<TYielded, TReturn, TNext>

/**
 * This type swaps `TYielded` and `TNext` of the `AsyncGenerator` produced by
 * the {@link BackgroundTask}.
 */
export type ForegroundTask<T> = T extends BackgroundTask<
  never,
  infer U,
  unknown,
  infer V
>
  ? () => AsyncGenerator<V, void, U>
  : never

/** Retrieve the initial value from a background task. */
export type InitialValue<T> = T extends BackgroundTask<
  infer U,
  unknown,
  unknown,
  unknown
>
  ? U
  : never

/** Retrieve the return value from a background task. */
export type ReturnValue<T> = T extends BackgroundTask<
  never,
  unknown,
  infer U,
  unknown
>
  ? U
  : never

/**
 * A report message is a message from the back to the front containing
 * {@link ReportDetails | useful details} on the progression of a task.
 */
export type ReportMessage<T extends StateKey> = {
  type: 'report'
  state: T
  details: T extends keyof ReportDetails ? ReportDetails[T] : undefined
}

/**
 * A message sent by the background task to the front end. It may be:
 *
 * - A `request`: the request content is returned by the `yield` keyword in the
 *   front end generator;
 * - A `result`: the final result as returned by {@link runBackgroundTask};
 * - A `report`: {@link ReportMessage}.
 */
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

/**
 * A message sent by the front end to the background task. It may be:
 *
 * - A `response` to a `request`;
 * - An `abort` request, that will cause the background task to be aborted.
 */
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

/** All the tasks available. */
export const Task = {
  ENCRYPT: 'encrypt',
  DECRYPT: 'decrypt',
  PAIR: 'pair',
} as const

/** A convenient way to retreive an actual task from its name. */
export const TaskMap = {
  [Task.PAIR]: pair,
  [Task.ENCRYPT]: encrypt,
  [Task.DECRYPT]: decrypt,
} as const

/**
 * Starts a background task by opening a runtime port. Every background task has
 * a foreground counterpart that may do nothing.
 *
 * @param taskName
 * @param task
 * @param initialValue
 * @param report
 * @param signal
 * @returns
 */
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

/** A do-nothing task, that can be used if the task isn't interactive. */
export const emptyForegroundTask: ForegroundTask<
  // `never` outlines the fact that `yield` will not be used
  BackgroundTask<unknown, never, unknown, never>
  // eslint-disable-next-line @typescript-eslint/no-empty-function
> = async function* () {}
