import { Report, Reporter, State } from 'report'
import { startBackgroundTask, Task } from 'task'

export enum ButtonState {
  IDLE,
  IN_PROGRESS,
  DONE,
  FAILED,
}

/** Sends a request to the background script to encrypt the given string. */
export const encryptString = async (
  string: string,
  reporter: Reporter,
  signal = new AbortController().signal
): Promise<string> =>
  startBackgroundTask(
    Task.ENCRYPT,
    async function* () {
      // Suspend the foreground task until the background task asks for a string
      yield
      yield string
    },
    {
      reporter,
      signal,
    }
  )

/** Sends a request to the background script to decrypt the given string. */
export const decryptString = async (
  string: string,
  reporter: Reporter,
  signal: AbortSignal
): Promise<string> =>
  startBackgroundTask(
    Task.DECRYPT,
    async function* () {
      // Suspend the foreground task until the background task asks for a string
      yield
      yield string
    },
    {
      reporter,
      signal,
    }
  )

/** Returns whether the given string contains a known encryption header. */
export const containsEncryptedText = (string: string): boolean =>
  string.includes('AAAAF')

/** Returns whether the given string is encrypted. */
export const isEncryptedText = (string: string): boolean =>
  string.trimStart().startsWith('AAAAF')

/** Return a trimmed encrypted message. */
export const extractEncryptedString = (string: string): string => {
  const extracted = /AAAAF\S*/s.exec(string)?.[0]
  if (!extracted) throw new Error('Nothing to extract')
  return extracted
}

/** Process a report to produce a helpful message, than passed as first argument to `f`. */
export const reporter =
  (f: (tooltip: string) => void) =>
  (report: Report): void => {
    if (report.state === State.SCANNING) {
      f(
        report.found === 0
          ? 'Make sure your phone and your computer are on the same network.'
          : 'Trying to reach your phone...'
      )
    } else if (report.state === State.NOTIFICATION_SENT) {
      f('Click on the notification you received.')
    }
  }
