/** All possible updates from all the background tasks. */
export const State = {
  LOOKING_FOR_DEVICES: 'Looking for devices.',
  ZEROCONF_TIMED_OUT: 'Zeroconf timed out.',
  DEVICES_FOUND: 'Devices found.',
  ALL_DEVICES_REFUSED: 'All devices refused to connect.',
} as const

/** If an update has additional details, they are defined here. */
export interface ReportDetails {
  [State.LOOKING_FOR_DEVICES]: { triesLeft: number }
  [State.DEVICES_FOUND]: { found: number }
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
  (<T extends Exclude<typeof State[keyof typeof State], keyof ReportDetails>>(
    state: T
  ) => void)

/** A reporter that does nothing. */
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const defaultReporter: Reporter = () => {}
