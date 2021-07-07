import type { ReportDetails, StateKey } from 'legacy-code/report'
import { BackgroundTask, MessageFromFrontToBack, TaskMap } from 'task'
import { browser, Runtime } from 'webextension-polyfill-ts'

browser.runtime.onConnect.addListener((port) => {
  const task = TaskMap[port.name as keyof typeof TaskMap]
  if (task === undefined) throw new Error('Unexpected connection.')
  void startTask(
    task as BackgroundTask<unknown, unknown, unknown, unknown>,
    port
  )
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

// eslint-disable-next-line sonarjs/cognitive-complexity
async function startTask<T, U, V, W>(
  task: BackgroundTask<T, V, U, W>,
  port: Runtime.Port
) {
  const controller = new AbortController()
  const initialValue = await getMessage<T>(port)
  const generator = task(
    initialValue,
    (state: StateKey, details?: ReportDetails[keyof ReportDetails]) => {
      console.log(state, details)
      if (!controller.signal.aborted)
        port.postMessage({ type: 'report', state, details })
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
    port.postMessage({ type: 'request', request: result.value })

    // eslint-disable-next-line no-await-in-loop
    const message = await getMessage<MessageFromFrontToBack<typeof task>>(port)

    if (message.type === 'response') {
      // eslint-disable-next-line no-await-in-loop
      result = await generator.next(message.response)
      continue
    }

    if (message.type === 'abort') {
      // Abort requests are handled above, no need to handle them twice
      continue
    }

    throw new Error(`Message received: ${message as string}`)
  }

  if (result.done) port.postMessage({ type: 'result', result: result.value })
}
