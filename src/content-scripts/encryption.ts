import type { Reporter } from '$/report'
import { startBackgroundTask, Task } from '$/task'

/** Sends a request to the background script to encrypt the given string. */
export const encryptString = async (
  string: string,
  reporter: Reporter,
  signal: AbortSignal
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

/** @returns Whether the given string contains a known encryption header */
export const containsEncryptedText = (string: string): boolean =>
  string.includes('AAAAF')

/** @returns Whether the given string is encrypted */
export const isEncryptedText = (string: string): boolean =>
  string.trimStart().startsWith('AAAAF')

/** @returns A trimmed encrypted message */
export const extractEncryptedString = (string: string): string => {
  const extracted = /AAAAF\S*/s.exec(string)?.[0]
  if (!extracted) throw new Error('No encrypted string found to extract.')
  return extracted
}
