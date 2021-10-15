/**
 * Persistent background script.
 *
 * The background script is responsible for starting backgrounds tasks and services.
 *
 * @module
 */

import type { Report } from '$/report'
import debug, { Debugger } from 'debug'
import { browser, Runtime } from 'webextension-polyfill-ts'
import { ErrorMessage, ExtensionError } from '$/error'
import { Observable } from '$/observable'
import {
  BackgroundTask,
  MessageFromFrontToBack,
  Task,
  TaskContext,
} from '$/task'
import {
  isZeroconfServiceInstalled,
  startZeroconfService,
} from './services/zeroconf'
import { decrypt, decryptFiles } from './tasks/decrypt'
import { encrypt, encryptFiles } from './tasks/encrypt'
import { login } from './tasks/login'
import { pair } from './tasks/pair'
import { isZeroconfRunning } from './tasks/zeroconf'

/** The background context, used to share information between tasks and services. */
const context: TaskContext = {
  zeroconfRunning: false,
  network: new Map(),
  scanFaster: new Observable<boolean>(false),
  newDeviceFound: new Observable<void>(undefined),
}

/**
 * Starts a background task, on a given port.
 *
 * @param task - Background task to start
 * @param port - Browser port to exchange with the foreground task
 * @param log - A logger function
 */
const startTask = async <TSent, TReceived, TReturn>(
  task: BackgroundTask<TSent, TReceived, TReturn>,
  port: Runtime.Port,
  log: Debugger
): Promise<void> => {
  log('Starting background task')

  // Start the background task
  const controller = new AbortController()
  const generator = task(
    context,
    (report: Report) => {
      if (!controller.signal.aborted)
        port.postMessage({ type: 'report', report })
    },
    controller.signal
  )

  // Handle disconnections and abortion requests
  port.onDisconnect.addListener(() => {
    controller.abort()
  })
  port.onMessage.addListener((message: MessageFromFrontToBack<typeof task>) => {
    if (message.type === 'abort') controller.abort()
  })

  // Run all the steps of the background task
  let result = await generator.next()
  while (!result.done && !controller.signal.aborted)
    result = await nextStep(generator, result, port, log)

  if (result.done) port.postMessage({ type: 'result', result: result.value })
}

/**
 * Runs one step of the generator (i.e. the code of a background task between
 * two `yield`s), and returns the result.
 */
const nextStep = async <TSent, TReceived, TReturn>(
  generator: AsyncGenerator<TSent, TReturn, TReceived>,
  result: IteratorResult<TSent, TReturn>,
  port: Runtime.Port,
  log: Debugger
): Promise<IteratorResult<TSent, TReturn>> => {
  // Shorthand for the generator's type
  type BgTask = BackgroundTask<TSent, TReceived, TReturn>

  // Send a request
  port.postMessage({ type: 'request', request: result.value })

  // Wait for the response to arrive
  const message = await new Promise<MessageFromFrontToBack<BgTask>>(
    (resolve) => {
      const onMessage = (message: MessageFromFrontToBack<BgTask>) => {
        port.onMessage.removeListener(onMessage)
        resolve(message)
      }

      port.onMessage.addListener(onMessage)
    }
  )

  log('Message received: %o', message)

  // If its a response to a request, resume the background task
  if (message.type === 'response') return generator.next(message.response)

  // Abort requests are handled in the main function, no need to handle them twice
  if (message.type === 'abort') return result

  throw new Error(`Unexpected message: ${message as string}`)
}

// Enable logging
if (process.env.NODE_ENV !== 'production') debug.enable('*')

// Start the Zeroconf scanning service
isZeroconfServiceInstalled()
  .then(async (installed) =>
    installed
      ? // If the service is properly installed, start it
        startZeroconfService(context)
      : // Otherwise, open a tutorial
        browser.tabs.create({
          url: browser.runtime.getURL('/zeroconf-unavailable.html'),
        })
  )
  .catch((error) => {
    debug('service:zeroconf')('%o', error)
    context.zeroconfRunning = false
  })

// Every connection maps to a background task
browser.runtime.onConnect.addListener(async (port) => {
  const taskMap: Record<Task, BackgroundTask<unknown, unknown, unknown>> = {
    [Task.Pair]: pair,
    [Task.Login]: login,
    [Task.Encrypt]: encrypt,
    [Task.EncryptFiles]: encryptFiles,
    [Task.Decrypt]: decrypt,
    [Task.DecryptFiles]: decryptFiles,
    [Task.IsZeroconfRunning]: isZeroconfRunning,
  }

  const task = taskMap[port.name as Task]
  if (task === undefined)
    throw new Error(`Unexpected connection: ${port.name}.`)

  // Start the task with its own logger
  const log = debug(`task:${port.name}:background`)

  try {
    // Run the task until completion
    await startTask(task, port, log)
  } catch (error: unknown) {
    log('%o', error)

    // If an error is thrown, send it to the foreground
    port.postMessage({
      type: 'error',
      error:
        error instanceof ExtensionError
          ? error.message
          : ErrorMessage.UnknownError,
    })
  }
})
