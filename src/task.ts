import type { PingResponse } from 'background/protocol'
import type { decrypt } from 'background/tasks/decrypt'
import type { encrypt } from 'background/tasks/encrypt'
import type { pair } from 'background/tasks/pair'
import debug, { Debugger } from 'debug'
import type { Observable } from 'observable'
import type { Phone } from 'phones'
import type { Report, Reporter } from 'report'
import { defaultReporter } from 'report'
import type { Writable } from 'svelte/store'
import { browser, Runtime } from 'webextension-polyfill-ts'

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
  context: TaskContext,
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
  ? () => AsyncGenerator<TReceived | undefined, void, TSent>
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
      | {
          type: 'report'
          report: Report
        }
      | {
          type: 'error'
          error: string
        }
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
export enum Task {
  ENCRYPT = 'encrypt',
  DECRYPT = 'decrypt',
  PAIR = 'pair',
}

/** A convenient way to retreive an actual task from its name. */
export type TaskMap = {
  [Task.PAIR]: typeof pair
  [Task.ENCRYPT]: typeof encrypt
  [Task.DECRYPT]: typeof decrypt
}

/** Background context shared between background tasks. */
export interface TaskContext {
  /** List of devices found by the Zeroconf service. */
  network: Map<
    string,
    {
      port: number
      phone?: Writable<Phone>
      keys?: PingResponse
    }
  >
  /** Set `scanFaster` to true to make the Zeroconf service run without cooldown. */
  scanFaster: Observable<boolean>
  /** A void Observable triggered every time a new device is found on the network. */
  newDeviceFound: Observable<void>
}

/**
 * Starts a background task by opening a runtime port. Every background task has
 * a foreground counterpart that may do nothing.
 *
 * @param taskName - Name of the port used
 * @param task - Foreground task that will respond to the requests of the background
 * @returns The return value of the background task, sent to the front end
 */
export const startBackgroundTask = async <T extends keyof TaskMap>(
  taskName: T,
  task: ForegroundTask<TaskMap[T]>,
  {
    reporter = defaultReporter,
    signal = new AbortController().signal,
  }: {
    /** A {@link Reporter | reporter} function that will receive asynchrounous updates. */
    reporter?: Reporter
    /** An abort signal. */
    signal?: AbortSignal
  } = {}
): Promise<ReturnType<TaskMap[T]>> => {
  const log = debug(`task:${taskName}:foreground`)
  log('Starting foreground task')

  // Start the foreground task
  const generator = task()
  await generator.next()

  return new Promise((resolve, reject) => {
    // Start the background task
    const port = browser.runtime.connect({ name: taskName })

    // Forward abort signal to the back end
    signal.addEventListener('abort', () => {
      log('Aborting task %o', taskName)
      port.postMessage({ type: 'abort' })
    })

    // Handle messages sent by the background task
    port.onMessage.addListener(
      messageListener<T>({ generator, reporter, resolve, reject, log })
    )
  })
}

/** Produces a function that handles messages received. */
const messageListener =
  <T extends keyof TaskMap>({
    generator,
    reporter,
    resolve,
    reject,
    log,
  }: {
    generator: AsyncGenerator
    reporter: Reporter
    resolve: (value: ReturnType<TaskMap[T]>) => void
    reject: (error: Error) => void
    log: Debugger
  }) =>
  async (message: MessageFromBackToFront<TaskMap[T]>, port: Runtime.Port) => {
    log('Message received: %o', message)

    // If we received a report, give it to the reporter
    if (message.type === 'report') {
      reporter(message.report)
      return
    }

    // If we received a request, resume the foreground task until a response is produced
    if (message.type === 'request') {
      const result = await generator.next(message.request)
      if (result.done) log('Generator exhausted, this is probably an error.')
      port.postMessage({ type: 'response', response: result.value as never })
      return
    }

    // If we received the result, end the task with the result value
    if (message.type === 'result') {
      resolve(message.result as never)
      port.disconnect()
      return
    }

    // If we received an error, rethrow it
    if (message.type === 'error') {
      reject(new Error(message.error))
      port.disconnect()
      return
    }

    throw new Error('Unexpected message')
  }
