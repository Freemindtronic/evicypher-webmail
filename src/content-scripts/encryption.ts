import type { Reporter } from 'report'
import { startBackgroundTask, Task } from 'task'

/** Send a request to the background script to encrypt the given string. */
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

/** Send a request to the background script to decrypt the given string. */
export const decryptString = async (
  string: string,
  reporter: Reporter,
  signal = new AbortController().signal
): Promise<string> =>
  startBackgroundTask(
    Task.DECRYPT,
    async function* () {
      yield
      yield string
    },
    {
      reporter,
      signal,
    }
  )

/** Return whether the given string contains a known encryption header and footer. */
export const containsEncryptedText = (string: string): boolean =>
  string.includes('AAAAF')

/** Return all encrypted messages found in a string. */
export const extractEncryptedStrings = (string: string): string[] => [
  ...(string.match(/AAAAF\S+/gs) ?? []),
]
