import debug, { Debugger } from 'debug'
import { Observable } from 'observable'
import type { Report } from 'report'
import { BackgroundTask, MessageFromFrontToBack, Task, TaskContext } from 'task'
import { browser, Runtime } from 'webextension-polyfill-ts'
import { decrypt } from './tasks/decrypt'
import { encrypt } from './tasks/encrypt'
import { pair } from './tasks/pair'
import { startZeroconfService } from './zeroconf-service'

// Enable all logs by default
debug.enable('*')

/** The background context, used to share information between tasks and services. */
const context: TaskContext = {
  devices: new Map(),
  scanFaster: new Observable<boolean>(false),
}

void startZeroconfService(context)

browser.runtime.onConnect.addListener((port) => {
  const task = {
    [Task.PAIR]: pair,
    [Task.ENCRYPT]: encrypt,
    [Task.DECRYPT]: decrypt,
  }[port.name]
  if (task === undefined) throw new Error('Unexpected connection.')

  const log = debug(`task:${port.name}:background`)

  void startTask(task as BackgroundTask<unknown, unknown, unknown>, port, log)
})

/**
 * Returns a promise on the next message of the port. Throws if disconnected
 * before a message is received.
 */
const getMessage = async <T = unknown>(port: Runtime.Port) =>
  new Promise<T>((resolve, reject) => {
    const onMessage = (message: T) => {
      removeListeners()
      resolve(message)
    }

    const onDisconnect = () => {
      removeListeners()
      reject()
    }

    const removeListeners = () => {
      port.onMessage.removeListener(onMessage)
      port.onDisconnect.removeListener(onDisconnect)
    }

    port.onMessage.addListener(onMessage)
    port.onDisconnect.addListener(onDisconnect)
  })

const startTask = async <TSent, TReceived, TReturn>(
  task: BackgroundTask<TSent, TReceived, TReturn>,
  port: Runtime.Port,
  log: Debugger
) => {
  log('Starting background task')

  const controller = new AbortController()
  const generator = task(
    context,
    (report: Report) => {
      if (!controller.signal.aborted)
        port.postMessage({ type: 'report', report })
    },
    controller.signal
  )

  port.onDisconnect.addListener(() => {
    controller.abort()
  })
  port.onMessage.addListener((message: MessageFromFrontToBack<typeof task>) => {
    if (message.type === 'abort') controller.abort()
  })

  let result = await generator.next()
  while (!result.done && !controller.signal.aborted) {
    result = await handleMessage<typeof task, TSent, TReturn, TReceived>(
      generator,
      result,
      port,
      log
    )
  }

  if (result.done) port.postMessage({ type: 'result', result: result.value })
}

const handleMessage = async <Task, TSent, TReturn, TReceived>(
  generator: AsyncGenerator<TSent, TReturn, TReceived>,
  result: IteratorResult<TSent, TReturn>,
  port: Runtime.Port,
  log: Debugger
) => {
  port.postMessage({ type: 'request', request: result.value })

  const message = await getMessage<MessageFromFrontToBack<Task>>(port)
  log('Message received: %o', message)

  if (message.type === 'response') {
    return generator.next(message.response as TReceived)
  }

  // Abort requests are handled in the main function, no need to handle them twice
  if (message.type === 'abort') return result

  throw new Error(`Message received: ${message as string}`)
}
