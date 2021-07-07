import type { ReportDetails, StateKey } from 'report'
import {
  BackgroundTask,
  MessageFromFrontToBack,
  TaskContext,
  TaskMap,
} from 'task'
import { browser, Runtime } from 'webextension-polyfill-ts'
import { getZeroconfService, ZeroconfResponse } from './zeroconf-service'

const context: TaskContext = {
  devices: [],
}

const runZeroconfService = async (context: TaskContext) => {
  while (true) {
    const nativePort = getZeroconfService()
    // A promise to a list of connected devices
    const zeroconfResponse = new Promise<Array<{ ip: string; port: number }>>(
      (resolve) => {
        const listener = (response: ZeroconfResponse) => {
          // Return an array of {ip, port}
          resolve(
            // The Zeroconf service returns `null` instead of an empty array
            response.result?.map(({ a: ip, port }) => ({ ip, port })) ?? []
          )
          nativePort.onMessage.removeListener(listener)
        }

        // Ask the service for a list of connected devices
        nativePort.onMessage.addListener(listener)
      }
    )
    nativePort.postMessage({ cmd: 'Lookup', type: '_evitoken._tcp.' })
    // eslint-disable-next-line no-await-in-loop
    context.devices = await zeroconfResponse
    console.log('Found:', zeroconfResponse)
  }
}

void runZeroconfService(context)

browser.runtime.onConnect.addListener((port) => {
  const task = TaskMap[port.name as keyof typeof TaskMap]
  if (task === undefined) throw new Error('Unexpected connection.')
  void startTask(task as BackgroundTask<unknown, unknown, unknown>, port)
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
async function startTask<TSent, TReceived, TReturn>(
  task: BackgroundTask<TSent, TReceived, TReturn>,
  port: Runtime.Port
) {
  const controller = new AbortController()
  const generator = task(
    context,
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
