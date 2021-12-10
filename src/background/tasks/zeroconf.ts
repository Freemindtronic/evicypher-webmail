/**
 * Zeroconf-related tasks.
 *
 * - {@link isZeroconfRunning}: returns whether the Zeroconf service is running or not.
 * - {@link resetZeroconf}: reset Zeroconf phone discovery
 *
 * @module
 */

import type { BackgroundTask } from '$/task'

/**
 * A basic task that returns the current state of the Zeroconf service. The
 * current state is reported as a boolean: true if running, false if not.
 */
export const isZeroconfRunning: BackgroundTask<void, void, boolean> =
  // eslint-disable-next-line require-yield
  async function* (context) {
    return context.zeroconfRunning
  }

/**
 * A basic task that empty the list of phone discovered by the Zeroconf service.
 * It allows a new inspection of all the phones on the network.
 */
export const resetZeroconf: BackgroundTask<void, void, void> =
  // eslint-disable-next-line require-yield
  async function* (context) {
    // Empty phone list
    context.network.clear()

    // Start fast scan to refresh list
    context.scanFaster.set(true)

    setTimeout(() => {
      context.scanFaster.set(false)
    }, 50)
  }
