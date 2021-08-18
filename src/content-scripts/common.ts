/**
 * Common functions for content scripts.
 *
 * @module
 */

import type { Reporter } from '$/report'
import type DecryptButton from './DecryptButton.svelte'
import type EncryptButton from './EncryptButton.svelte'
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

/**
 * Adds all the listeners necessary to make the button interactive.
 *
 * @remarks
 *   This function ensures that the state of the button is always consistent.
 */
export const addClickListener = (
  button: EncryptButton | DecryptButton,
  listener: (
    promise: Promise<void> | undefined,
    resolved: boolean,
    rejected: boolean,
    signal: AbortSignal
  ) => Promise<void> | undefined
): void => {
  /** Abort controller, bound to a button in the tooltip. */
  let controller: AbortController
  button.$on('abort', () => {
    controller.abort()
    promise = undefined
    button.$set({ promise })
  })

  let promise: Promise<void> | undefined
  let resolved = false
  let rejected = false

  // When the button is clicked, trigger the event listener
  button.$on('click', () => {
    if (promise === undefined) controller = new AbortController()
    promise = listener(promise, resolved, rejected, controller.signal)
    button.$set({ promise })
    resolved = false
    rejected = false
    promise
      ?.then(() => {
        resolved = true
      })
      .catch(() => {
        rejected = true
      })
  })
}
