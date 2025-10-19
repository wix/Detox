const SimulatorAppCache = require('../../../common/drivers/ios/tools/SimulatorAppCache');

/**
 * AppStateResetFallback provides app state reset functionality for iOS simulators.
 *
 * This class serves as a fallback implementation because iOS does not provide a native
 * way to reset an app's state (unlike Android's `pm clear` command). To achieve app
 * state reset on iOS, this class implements a backup-uninstall-reinstall strategy:
 *
 * 1. Backs up the app installation to cache
 * 2. Uninstalls the current app instance
 * 3. Restores the app installation from cache
 *
 * This approach ensures the app is returned to a clean state without requiring
 * a full app reinstallation from the original bundle, making it more friendly
 * to local development flows.
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
    this.applesimutils = applesimutils;
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
      await this.appCache.backup(udid, bundleId);
      await this.applesimutils.uninstall(udid, bundleId);
    }

    for (const bundleId of bundleIds) {
      await this.appCache.restore(udid, bundleId);
    }
  }

  /**
   * Ensures removal of cached app(s) after a potentially
   * destructive action (such as install or uninstall),
   * so {@link resetAppState} can't use a stale backup from cache.
   *
   * @param {string} udid - The device identifier
   * @param {string} [bundleId] - Optional bundle identifier for specific app invalidation
   * @returns {Promise<void>}
   */
  async invalidate(udid, bundleId) {
    if (bundleId) {
      await this.appCache.remove(udid, bundleId);
    } else {
      await this.appCache.cleanup(udid);
    }
  }
}

module.exports = AppStateResetFallback;
