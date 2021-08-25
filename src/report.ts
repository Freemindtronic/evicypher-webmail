/**
 * Reports are asynchronous updates from a background task. They are used to
 * display a task advancement to the user.
 *
 * @module
 */

import type { ErrorMessage } from '$/error'

/** All possible updates from all the background tasks. */
export enum State {
  Scanning = 'Scanning in progress.',
  NotificationSent = 'Notification sent.',
  WaitingForPhone = 'Waiting for the favorite phone to be found.',
  WaitingForFirstResponse = 'Waiting for the favorite phone to answer.',
  SubtaskInProgress = 'Task in progress.',
  SubtaskComplete = 'Task complete.',
  SubtaskFailed = 'Task failed.',
}

/** If an update has additional details, they are defined here. */
export type Report =
  | { state: State.Scanning; found: number }
  | { state: State.NotificationSent }
  | { state: State.WaitingForPhone }
  | { state: State.WaitingForFirstResponse }
  | {
      state: State.SubtaskInProgress
      /** A number between 0 and 1. */
      progress: number
      /** A unique identifier of the task. */
      taskId: string
    }
  | { state: State.SubtaskComplete; taskId: string; name: string; url: string }
  | { state: State.SubtaskFailed; taskId: string; message: ErrorMessage }

/**
 * A reporter is a function that receives updates from the background process to
 * display them to the user.
 */
export type Reporter = (state: Report) => void
