import type { BackgroundTask } from 'task'

/**
 * A basic task that returns the current state of the Zeroconf service. The
 * current state is reported as a boolean: true if running, false if not.
 */
export const isZeroconfRunning: BackgroundTask<void, void, boolean> =
  // eslint-disable-next-line require-yield
  async function* (context) {
    return context.zeroconfRunning
  }
