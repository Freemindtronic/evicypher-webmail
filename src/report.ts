/** All possible updates from all the background tasks. */
export enum State {
  SCANNING = 'Scan complete.',
  NOTIFICATION_SENT = 'Notification sent.',
  WAITING_FOR_PHONE = 'Waiting for the favorite phone to be reachable.',
}

/** If an update has additional details, they are defined here. */
export type Report =
  | { state: State.SCANNING; found: number }
  | { state: State.NOTIFICATION_SENT }
  | { state: State.WAITING_FOR_PHONE }

/**
 * A reporter is a function that receives updates from the background process to
 * display them to the user.
 */
export type Reporter = (state: Report) => void

/** A reporter that does nothing. */
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const defaultReporter: Reporter = () => {}
