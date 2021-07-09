/** All possible updates from all the background tasks. */
export enum State {
  SCAN_COMPLETE = 'Scan complete.',
}

/** If an update has additional details, they are defined here. */
export type Report = { state: State.SCAN_COMPLETE; found: number }

/**
 * A reporter is a function that receives updates from the background process to
 * display them to the user.
 */
export type Reporter = (state: Report) => void

/** A reporter that does nothing. */
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const defaultReporter: Reporter = () => {}