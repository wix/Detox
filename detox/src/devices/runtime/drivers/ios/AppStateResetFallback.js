const SimulatorAppCache = require('../../../common/drivers/ios/tools/SimulatorAppCache');

/**
 * AppStateResetFallback provides app state reset functionality for iOS simulators.
 *
 * This class serves as a fallback implementation because iOS does not provide a native
 * way to reset an app's state (unlike Android's `pm clear` command). To achieve app
 * state reset on iOS, this class implements a backup-uninstall-reinstall strategy:
 *
 * 1. Pulls (backs up) the app's container data to cache
 * 2. Uninstalls the current app instance
 * 3. Pushes (reinstalls) the app from cache
 *
 * This approach ensures the app is returned to a clean state without requiring
 * a full app reinstallation from the original bundle, making it more efficient
 * than the traditional uninstall/install cycle.
 *
 * @class AppStateResetFallback
 */
class AppStateResetFallback {
  /**
   * Creates an instance of AppStateResetFallback.
   * @param {Object} config
   * @param {import('../../../common/drivers/ios/tools/AppleSimUtils')} config.applesimutils - AppleSimUtils instance
   * @param {SimulatorAppCache} [config.appCache] - Optional SimulatorAppCache instance (for testing/mocking)
   */
  constructor({ applesimutils, appCache }) {
    this.appCache = appCache ?? new SimulatorAppCache({ applesimutils });
  }

  /**
   * Resets the app state for multiple apps by backing them up and restoring them.
   * This effectively clears the app state while preserving the app installation.
   *
   * @param {string} udid - The device identifier
   * @param {string[]} bundleIds - Array of app bundle identifiers to reset
   * @returns {Promise<void>}
   */
  async resetAppState(udid, bundleIds) {
    for (const bundleId of bundleIds) {
      await this.appCache.pull(udid, bundleId);
    }

    for (const bundleId of bundleIds) {
      await this.appCache.push(udid, bundleId);
    }
  }
}

module.exports = AppStateResetFallback;
