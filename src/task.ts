/**
 * Tasks are one of the core concepts of the extension.
 *
 * ## What is a task?
 *
 * A task is made of two functions: one in the background and one in the
 * foreground. Tasks are implemented using async
 * [generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*)
 * to emulate a communication channel between the front and the back.
 *
 * [<img alt="Diagram"
 * src="https://mermaid.ink/img/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gICAgRnJvbnQtPj4rQmFjazogT3BlbnMgYSBwb3J0XG4gICAgYWN0aXZhdGUgRnJvbnRcbiAgICBOb3RlIG92ZXIgRnJvbnQsIEJhY2s6IEJvdGggZ2VuZXJhdG9ycyBhcmUgc3RhcnRlZDxicj5hdCB0aGUgc2FtZSB0aW1lLiBUaGV5IHJ1bjxicj51bnRpbCByZWFjaGluZyB0aGUgZmlyc3QgeWllbGQuXG5cbiAgICBkZWFjdGl2YXRlIEZyb250XG4gICAgbG9vcFxuICAgIEJhY2stPj4rRnJvbnQ6IFJlcXVlc3RcbiAgICBkZWFjdGl2YXRlIEJhY2tcbiAgICBGcm9udC0-PitCYWNrOiBSZXNwb25zZVxuICAgIGRlYWN0aXZhdGUgRnJvbnRcbiAgICBlbmRcbiAgICBCYWNrLT4-RnJvbnQ6IFJldHVybiB2YWx1ZVxuICAgIGRlYWN0aXZhdGUgQmFja1xuIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifSwidXBkYXRlRWRpdG9yIjpmYWxzZSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOmZhbHNlfQ">](https://mermaid-js.github.io/mermaid-live-editor/edit##eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gICAgRnJvbnQtPj4rQmFjazogT3BlbnMgYSBwb3J0XG4gICAgYWN0aXZhdGUgRnJvbnRcbiAgICBOb3RlIG92ZXIgRnJvbnQsIEJhY2s6IEJvdGggZ2VuZXJhdG9ycyBhcmUgc3RhcnRlZDxicj5hdCB0aGUgc2FtZSB0aW1lLiBUaGV5IHJ1bjxicj51bnRpbCByZWFjaGluZyB0aGUgZmlyc3QgeWllbGQuXG4gICAgTm90ZSBvdmVyIEZyb250LCBCYWNrOiBoZXlcbiAgICBkZWFjdGl2YXRlIEZyb250XG4gICAgbG9vcFxuICAgIEJhY2stPj4rRnJvbnQ6IFJlcXVlc3RcbiAgICBkZWFjdGl2YXRlIEJhY2tcbiAgICBGcm9udC0-PitCYWNrOiBSZXNwb25zZVxuICAgIGRlYWN0aXZhdGUgRnJvbnRcbiAgICBlbmRcbiAgICBCYWNrLT4-RnJvbnQ6IFJldHVybiB2YWx1ZVxuICAgIGRlYWN0aXZhdGUgQmFja1xuIiwibWVybWFpZCI6IntcbiAgXCJ0aGVtZVwiOiBcImRlZmF1bHRcIlxufSIsInVwZGF0ZUVkaXRvciI6ZmFsc2UsImF1dG9TeW5jIjp0cnVlLCJ1cGRhdGVEaWFncmFtIjpmYWxzZX0)
 *
 * For instance, let's say one wants to implement a task that will:
 *
 * - Send a number from the front to the back;
 * - Send another number from the front to the back;
 * - Return the sum of the two numbers.
 *
 * Because of the way tasks are implemented, it is always the back that sends
 * the first request, but in this case, we want the front to send the first
 * data. This is done by sending an empty Request first.
 *
 * Here is an incomplete implementation (because tasks require much more wiring):
 *
 * ```ts
 * //          Values yielded by the back / ...by the front
 * //                                   |          | Value returned by `startBackgroundTask`
 * //                                   ↓          ↓       ↓
 * const backgroundTask: BackgroundTask<undefined, number, number> =
 *   async function* (
 *     context: TaskContext,
 *     reporter: Reporter,
 *     signal: AbortSignal
 *   ) {
 *     // Receive two number
 *     const x = yield
 *     const y = yield
 *
 *     // Complete the task and return the sum
 *     return x + y
 *   }
 *
 * // The type of this function is based on the type of the background generator
 * const foregroundTask: ForegroundTask<typeof backgroundTask> =
 *   async function* () {
 *     // Suspend the task until the front sends the first request
 *     yield
 *
 *     const values = crypto.getRandomValues(new Uint8Array(2))
 *     yield values[0]
 *     yield values[1]
 *   }
 *
 * // Start the task, wait for the result
 * const sum = await startBackgroundTask(
 *   'backgroundTask',
 *   foregroundTask,
 *   {}
 * )
 * ```
 *
 * Note: `yield` can be used to send AND receive data at the same time:
 *
 * ```ts
 * // In the background generator:
 * yield 'Hello {name}!'
 * const str = yield 'World' // Send a request, wait for the response
 * console.log(str)
 *
 * // In the foreground generator:
 * const template = yield
 * const name = yield
 * yield template.replace('{name}', name)
 * ```
 *
 * You can think of `yield` as a function that works the same way as `await
 * fetch`: it blocks until a response is received.
 *
 * ## How to create a new task?
 *
 * - Add a new constant to the {@link Task} enum.
 * - Implement the background generator in `src/background/tasks/*name*.ts`.
 * - Register the type in the {@link TaskMap}.
 * - Implement the foreground generator in the front-end.
 *
 * To run this newly created task, you need call {@link startBackgroundTask} properly:
 *
 * ```ts
 * // A controller to cancel a running task
 * const controller = new AbortController()
 * cancelButton.onclick = () => {
 *   controller.abort()
 * }
 *
 * // A reporter to get the status of the task
 * const reporter = (report: Report) => {
 *   console.log(report)
 * }
 *
 * const value = await startBackgroundTask(Task.NEW_TASK, foregroundTask, {
 *   signal: controller.signal,
 *   reporter,
 * })
 * ```
 *
 * ## What are `signal` and `reporter`?
 *
 * In addition to the `Request`, `Response` and `Return` messages, there are
 * three additional types of messages:
 *
 * - `Report` messages are asynchronous updates to the task status, sent from the
 *   back to the front.
 * - `Abort` messages are used to abort the task, sent from the front to the back.
 * - `Error`s are exception raised in the pack, propagated to the front.
 *
 * See {@link MessageFromBackToFront}`and`{@link MessageFromFrontToBack} for
 * additional information.
 *
 * @module
 */

import type { PingResponse } from '$/background/protocol'
import type { decrypt, decryptFiles } from '$/background/tasks/decrypt'
import type { encrypt, encryptFiles } from '$/background/tasks/encrypt'
import type { pair } from '$/background/tasks/pair'
import type { isZeroconfRunning } from '$/background/tasks/zeroconf'
import type { Observable } from '$/observable'
import type { Phone } from '$/phones'
import type { Report, Reporter } from '$/report'
import type { Writable } from 'svelte/store'
import debug, { Debugger } from 'debug'
import { browser, Runtime } from 'webextension-polyfill-ts'
import { ErrorMessage, ExtensionError } from '$/error'

/** All the tasks available. */
export enum Task {
  /** See {@link encrypt}. */
  Encrypt = 'encrypt',
  /** See {@link encryptFiles}. */
  EncryptFiles = 'encrypt-files',
  /** See {@link decrypt}. */
  Decrypt = 'decrypt',
  /** See {@link decryptFiles}. */
  DecryptFiles = 'decrypt-files',
  /** See {@link pair}. */
  Pair = 'pair',
  /** See {@link isZeroconfRunning}. */
  IsZeroconfRunning = 'is-zeroconf-running',
}

/** Maps a task to the type of its background generator. */
export type TaskMap = {
  [Task.Pair]: typeof pair
  [Task.Encrypt]: typeof encrypt
  [Task.EncryptFiles]: typeof encryptFiles
  [Task.Decrypt]: typeof decrypt
  [Task.DecryptFiles]: typeof decryptFiles
  [Task.IsZeroconfRunning]: typeof isZeroconfRunning
}

/**
 * A background task is an asynchronous generator transparently connected to a
 * foreground task. The `yield` keyword is used to exchange data between them.
 *
 * ```ts
 *  const backgroundTask: BackgroundTask<TSent, TReceived, TReturn> = async function()* {
 *  const sent: TSent
 *  const received: TReceived = yield
 *  const returned: TReturn
 *  return returned
 * }
 * ```
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

/** Retrieves the sent type from a background task. */
export type SentType<T> = T extends BackgroundTask<
  infer TSent,
  unknown,
  unknown
>
  ? TSent
  : never

/** Retrieves the received type from a background task. */
export type ReceivedType<T> = T extends BackgroundTask<
  unknown,
  infer TReceived,
  unknown
>
  ? TReceived
  : never

/** Retrieves the return type from a background task. */
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
 * - A `report`: an asynchronous update to the task status, see {@link Report};
 * - An `error`: an exception to propagate, see {@link ErrorMessage}.
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
          error: ErrorMessage
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

/** Background context shared between background tasks and services. */
export interface TaskContext {
  /** The current state of the Zeroconf service. */
  zeroconfRunning: boolean
  /**
   * List of devices found by the Zeroconf service. The keys are IP addresses,
   * and the values are various details got by the Zeroconf service.
   */
  network: Map<
    string,
    {
      /** Port advertised for communication with the device. */
      port: number
      /**
       * When the device was last seen. Value returned by `Date.now()`, amount
       * of milliseconds since 1970/01/01.
       */
      lastSeen: number
      /**
       * If the device is a paired phone with the Freemindtronic app installed,
       * this property is defined.
       */
      // The `phone` and `keys` keys are voluntarily not optional, it helps destructuring
      phone:
        | {
            /** A store wrapping a {@link Phone} object. */
            store: Writable<Phone>
            /** If keys are fetched to identify the phone, they are cached here. */
            keys:
              | {
                  pingResponse: PingResponse
                  date: number
                }
              | undefined
          }
        | undefined
    }
  >
  /** Set `scanFaster` to true to make the Zeroconf service run without cool-down. */
  scanFaster: Observable<boolean>
  /** A void Observable triggered every time a new device is found on the network. */
  newDeviceFound: Observable<void>
}

/**
 * Starts a background task by opening a runtime port. Every background task has
 * a foreground counterpart that may do nothing.
 *
 * @param taskName - Name of the port used
 * @param foregroundTask - Foreground task that will respond to the requests of
 *   the background
 * @returns The return value of the background task, sent to the front end
 */
export const startBackgroundTask = async <T extends keyof TaskMap>(
  taskName: T,
  foregroundTask: ForegroundTask<TaskMap[T]>,
  {
    reporter,
    signal,
  }: {
    /** A {@link Reporter | reporter} function that will receive asynchronous updates. */
    reporter: Reporter
    /** An abort signal. */
    signal: AbortSignal
  }
): Promise<ReturnType<TaskMap[T]>> => {
  const log = debug(`task:${taskName}:foreground`)
  log('Starting foreground task')

  // Start the foreground task
  const generator = foregroundTask()
  await generator.next()

  return new Promise((resolve, reject) => {
    // Start the background task
    const port = browser.runtime.connect({ name: taskName })

    // Forward abort signal to the back end
    signal.addEventListener('abort', () => {
      log('Aborting task %o', taskName)
      try {
        port.postMessage({ type: 'abort' })
      } catch {
        // Ignore exceptions thrown when the port is closed because the task
        // is already canceled
      }
    })

    // Handle messages sent by the background task
    port.onMessage.addListener(
      messageListener<T>({ generator, reporter, resolve, reject, log })
    )
  })
}

/**
 * Produces a function that handles messages received. When a message is
 * received, the foreground generator is resumed until it responds.
 */
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
      reject(new ExtensionError(message.error))
      port.disconnect()
      return
    }

    throw new Error(`Unexpected message: ${message as string}.`)
  }
