const path = require('path');

const { DetoxRuntimeError } = require('../../../../../errors');
const fse = require('../../../../../utils/fsext');
const { getDetoxAppsCachePath } = require('../../../../../utils/environment');
const log = require('../../../../../utils/logger').child({ cat: 'device,app-cache' });

class SimulatorAppCache {
  constructor({ applesimutils, rootDir = getDetoxAppsCachePath() }) {
    this.applesimutils = applesimutils;
    this.rootDir = rootDir;
  }

  /**
   * Pull (backup) an app to cache
   * @param {string} deviceId - The device identifier
   * @param {string} bundleId - The app's bundle identifier
   * @returns {Promise<string>} The path to the cached app
   */
  async pull(deviceId, bundleId) {
    const appContainerPath = await this.applesimutils.getAppContainer(deviceId, bundleId);
    if (!appContainerPath) {
      throw new DetoxRuntimeError({
        message: `App with bundle ID '${bundleId}' is not installed on this device (${deviceId}). Please install the app first before attempting to reset its state.`,
        hint: `To check apps installed on the device, use: xcrun simctl listapps ${deviceId}`,
      });
    }

    const cacheAppPath = this._getAppCachePath(deviceId, bundleId);
    await fse.ensureDir(path.dirname(cacheAppPath));
    await fse.remove(cacheAppPath);
    await fse.copy(appContainerPath, cacheAppPath);

    return cacheAppPath;
  }

  /**
   * Push (restore) an app from cache
   * @param {string} deviceId - The device identifier
   * @param {string} bundleId - The app's bundle identifier
   * @returns {Promise<void>}
   */
  async push(deviceId, bundleId) {
    const cacheAppPath = this._getAppCachePath(deviceId, bundleId);

    if (!await fse.exists(cacheAppPath)) {
      throw new DetoxRuntimeError({
        message: `No backup found for bundle ID '${bundleId}' on device ${deviceId}. This should not happen unless you're calling SimulatorAppCache#push() directly.`,
        hint: `Make sure to call pull() first to backup the app before attempting to push from cache.`,
      });
    }

    // Uninstall the current app
    await this.applesimutils.uninstall(deviceId, bundleId);

    // Reinstall from cache
    await this.applesimutils.install(deviceId, cacheAppPath);
  }

  /**
   * Check if an app is cached
   * @param {string} deviceId - The device identifier
   * @param {string} bundleId - The app's bundle identifier
   * @returns {Promise<boolean>} True if the app is cached
   */
  async exists(deviceId, bundleId) {
    const cacheAppPath = this._getAppCachePath(deviceId, bundleId);
    return await fse.exists(cacheAppPath);
  }

  /**
   * Remove cache for a specific app
   * @param {string} deviceId - The device identifier
   * @param {string} bundleId - The app's bundle identifier
   * @returns {Promise<void>}
   */
  async remove(deviceId, bundleId) {
    try {
      const cacheAppPath = this._getAppCachePath(deviceId, bundleId);
      if (await fse.exists(cacheAppPath)) {
        await fse.remove(cacheAppPath);
        log.debug(`Removed app cache for ${bundleId} on device ${deviceId}`);
      }
    } catch (err) {
      log.warn({ err }, `Failed to remove app cache for ${bundleId} on device ${deviceId}`);
    }
  }

  /**
   * Clean up cache for a device
   * @param {string} deviceId - The device identifier
   * @returns {Promise<void>}
   */
  async cleanup(deviceId) {
    try {
      // Clean up entire device cache
      const deviceCachePath = this._getDeviceCachePath(deviceId);
      if (await fse.exists(deviceCachePath)) {
        await fse.remove(deviceCachePath);
        log.debug(`Cleaned up app cache for device ${deviceId}`);
      }
    } catch (err) {
      log.warn({ err }, `Failed to cleanup app cache for device ${deviceId}`);
    }
  }

  /**
   * Get the cache path for a specific app on a device
   * @param {string} deviceId - The device identifier
   * @param {string} bundleId - The app's bundle identifier
   * @returns {string} The full path to the cached app
   * @private
   */
  _getAppCachePath(deviceId, bundleId) {
    return path.join(this._getDeviceCachePath(deviceId), `${bundleId}.app`);
  }

  /**
   * Get the device cache directory path
   * @param {string} deviceId - The device identifier
   * @returns {string} The device cache directory path
   * @private
   */
  _getDeviceCachePath(deviceId) {
    return path.join(this.rootDir, deviceId);
  }
}

module.exports = SimulatorAppCache;
