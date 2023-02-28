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
import debug from 'debug';
import { browser } from 'webextension-polyfill-ts';
import { ExtensionError } from '$/error';
/** All the tasks available. */
export var Task;
(function (Task) {
    /** See {@link encrypt}. */
    Task["Encrypt"] = "encrypt";
    /** See {@link encryptFiles}. */
    Task["EncryptFiles"] = "encrypt-files";
    /** See {@link decrypt}. */
    Task["Decrypt"] = "decrypt";
    /** See {@link decryptFiles}. */
    Task["DecryptFiles"] = "decrypt-files";
    /** See {@link pair}. */
    Task["Pair"] = "pair";
    /** See {@link login}. */
    Task["Login"] = "login";
    /** See {@link cloud} */
    Task["Cloud"] = "cloud";
    /** See {@link isZeroconfRunning}. */
    Task["IsZeroconfRunning"] = "is-zeroconf-running";
    /** See {@link resetZeroconf}. */
    Task["ResetZeroconf"] = "reset-zeroconf";
})(Task || (Task = {}));
/**
 * Starts a background task by opening a runtime port. Every background task has
 * a foreground counterpart that may do nothing.
 *
 * @param taskName - Name of the port used
 * @param foregroundTask - Foreground task that will respond to the requests of
 *   the background
 * @returns The return value of the background task, sent to the front end
 */
export const startBackgroundTask = async (taskName, foregroundTask, { reporter, signal, }) => {
    const log = debug(`task:${taskName}:foreground`);
    log('Starting foreground task');
    // Start the foreground task
    const generator = foregroundTask();
    await generator.next();
    return new Promise((resolve, reject) => {
        // Start the background task
        const port = browser.runtime.connect({ name: taskName });
        // Forward abort signal to the back end
        signal.addEventListener('abort', () => {
            log('Aborting task %o', taskName);
            try {
                port.postMessage({ type: 'abort' });
            }
            catch (_a) {
                // Ignore exceptions thrown when the port is closed because the task
                // is already canceled
            }
        });
        // Handle messages sent by the background task
        port.onMessage.addListener(messageListener({ generator, reporter, resolve, reject, log }));
    });
};
/**
 * Produces a function that handles messages received. When a message is
 * received, the foreground generator is resumed until it responds.
 */
const messageListener = ({ generator, reporter, resolve, reject, log, }) => async (message, port) => {
    log('Message received: %o', message);
    // If we received a report, give it to the reporter
    if (message.type === 'report') {
        reporter(message.report);
        return;
    }
    // If we received a request, resume the foreground task until a response is produced
    if (message.type === 'request') {
        const result = await generator.next(message.request);
        if (result.done)
            log('Generator exhausted, this is probably an error.');
        port.postMessage({ type: 'response', response: result.value });
        return;
    }
    // If we received the result, end the task with the result value
    if (message.type === 'result') {
        resolve(message.result);
        port.disconnect();
        return;
    }
    // If we received an error, rethrow it
    if (message.type === 'error') {
        reject(new ExtensionError(message.error));
        port.disconnect();
        return;
    }
    throw new Error(`Unexpected message: ${message}.`);
};
//# sourceMappingURL=task.js.map