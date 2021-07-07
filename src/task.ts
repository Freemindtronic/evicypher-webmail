import { decrypt } from 'background/tasks/decrypt'
import { encrypt } from 'background/tasks/encrypt'
import { pair } from 'background/tasks/pair'
import type { ReportDetails, Reporter, ReporterImpl, StateKey } from 'report'
import { defaultReporter } from 'report'
import { browser } from 'webextension-polyfill-ts'

/**
 * A background task is an asynchronous generator transparently connected to a
 * foreground task. The `yield` keyword is used to exchange data between them.
 *
 * @typeParam TSent - Type of the data sent to the foreground task
 * @typeParam TReceived - Type of the data received from the foreground task
 * @typeParam TReturn - Type of the data used as a return value to
 *   {@link startBackgroundTask}
 */
export type BackgroundTask<TSent, TReceived, TReturn> = (
  context: unknown,
  reporter: Reporter,
  signal: AbortSignal
) => AsyncGenerator<TSent, TReturn, TReceived>

/**
 * This type swaps `TSent` and `TReceived` of the `AsyncGenerator` produced by
 * the {@link BackgroundTask}.
 */
export type ForegroundTask<T> = T extends BackgroundTask<
  infer TSent,
  infer TReceived,
  unknown
>
  ? () => AsyncGenerator<TReceived, void, TSent>
  : never

/** Retrieve the sent type from a background task. */
export type SentType<T> = T extends BackgroundTask<
  infer TSent,
  unknown,
  unknown
>
  ? TSent
  : never

/** Retrieve the received type from a background task. */
export type ReceivedType<T> = T extends BackgroundTask<
  unknown,
  infer TReceived,
  unknown
>
  ? TReceived
  : never

/** Retrieve the return type from a background task. */
export type ReturnType<T> = T extends BackgroundTask<
  unknown,
  unknown,
  infer TReturn
>
  ? TReturn
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
 * - A `result`: the final result as returned by {@link startBackgroundTask};
 * - A `report`: {@link ReportMessage}.
 */
export type MessageFromBackToFront<T> = T extends BackgroundTask<
  infer TSent,
  unknown,
  infer TReturn
>
  ?
      | {
          type: 'request'
          request: TSent
        }
      | {
          type: 'result'
          result: TReturn
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
  unknown,
  infer TReceived,
  unknown
>
  ?
      | {
          type: 'response'
          response: TReceived
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
export const startBackgroundTask = async <T extends keyof typeof TaskMap>(
  taskName: T,
  task: ForegroundTask<typeof TaskMap[T]>,
  {
    report = defaultReporter,
    signal = new AbortController().signal,
  }: {
    report?: ReporterImpl
    signal?: AbortSignal
  } = {}
): Promise<ReturnType<typeof TaskMap[T]>> => {
  const generator = task()
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
          const result = await generator.next(message.request as never)
          if (result.done)
            console.warn('Generator exhausted, this is probably an error.')
          port.postMessage({ type: 'response', response: result.value })
          return
        }

        if (message.type === 'result') {
          resolve(message.result as never)
          port.disconnect()
          return
        }

        throw new Error('Unexpected message')
      }
    )
  })
}
