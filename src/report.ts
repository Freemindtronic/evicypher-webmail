/** All possible updates from all the background tasks. */
export const State = {
  LOOKING_FOR_DEVICES: 'Looking for devices.',
  ZEROCONF_TIMED_OUT: 'Zeroconf timed out.',
  SCAN_COMPLETE: 'Scan complete.',
  ALL_DEVICES_REFUSED: 'All devices refused to connect.',
} as const

export type StateKey = typeof State[keyof typeof State]

/** If an update has additional details, they are defined here. */
export interface ReportDetails {
  [State.LOOKING_FOR_DEVICES]: { triesLeft: number }
  [State.SCAN_COMPLETE]: { found: number }
}

/**
 * A reporter is a function that receives updates from the background process to
 * display them to the user. The type looks scary at first but it's written to
 * force a second parameter if the state is in `ReportDetails`, and prevent it if not.
 */
export type Reporter = (<T extends keyof ReportDetails>(
  state: T,
  details: ReportDetails[T]
) => void) &
  (<T extends Exclude<StateKey, keyof ReportDetails>>(state: T) => void)

/** A less strict version of the `Reporter` to make implementation easier. */
export type ReporterImpl = <T extends StateKey>(
  state: T,
  details: T extends keyof ReportDetails ? ReportDetails[T] : undefined
) => void

/** A reporter that does nothing. */
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const defaultReporter: Reporter = () => {}
