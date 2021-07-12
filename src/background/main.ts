import debug, { Debugger } from 'debug'
import { Observable } from 'observable'
import type { Report } from 'report'
import { BackgroundTask, MessageFromFrontToBack, Task, TaskContext } from 'task'
import { browser, Runtime } from 'webextension-polyfill-ts'
import { decrypt } from './tasks/decrypt'
import { encrypt } from './tasks/encrypt'
import { pair } from './tasks/pair'
import { startZeroconfService } from './zeroconf-service'

/** The background context, used to share information between tasks and services. */
const context: TaskContext = {
  devices: new Map(),
  scanFaster: new Observable<boolean>(false),
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

/** Runs one step of the generator, and returns the result. */
const nextStep = async <TSent, TReceived, TReturn>(
  generator: AsyncGenerator<TSent, TReturn, TReceived>,
  result: IteratorResult<TSent, TReturn>,
  port: Runtime.Port,
  log: Debugger
): Promise<IteratorResult<TSent, TReturn>> => {
  // Send a request
  port.postMessage({ type: 'request', request: result.value })

  // Wait for the response to arrive
  const message = await new Promise<
    MessageFromFrontToBack<BackgroundTask<TSent, TReceived, TReturn>>
  >((resolve) => {
    const onMessage = (
      message: MessageFromFrontToBack<BackgroundTask<TSent, TReceived, TReturn>>
    ) => {
      port.onMessage.removeListener(onMessage)
      resolve(message)
    }

    port.onMessage.addListener(onMessage)
  })

  log('Message received: %o', message)

  // If its a response to a request, resume the background task
  if (message.type === 'response') return generator.next(message.response)

  // Abort requests are handled in the main function, no need to handle them twice
  if (message.type === 'abort') return result

  throw new Error(`Message received: ${message as string}`)
}

// Enable all logs by default
debug.enable('*')

// Start the Zeroconf scanning service
void startZeroconfService(context)

// Every connection maps to a background task
browser.runtime.onConnect.addListener(async (port) => {
  const task = {
    [Task.PAIR]: pair,
    [Task.ENCRYPT]: encrypt,
    [Task.DECRYPT]: decrypt,
  }[port.name]
  if (task === undefined) throw new Error('Unexpected connection.')

  // Start the task with its own logger
  const log = debug(`task:${port.name}:background`)

  try {
    await startTask(
      task as BackgroundTask<unknown, unknown, unknown>,
      port,
      log
    )
  } catch (error: unknown) {
    log('%o', error)
    if (error instanceof Error)
      port.postMessage({ type: 'error', error: error.message })
  }
})
