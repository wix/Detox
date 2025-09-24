const path = require('path');

const { DetoxInternalError, DetoxRuntimeError } = require('../../../../../errors');
const { getDetoxAppsCachePath } = require('../../../../../utils/environment');
const fse = require('../../../../../utils/fsext');
const log = require('../../../../../utils/logger').child({ cat: 'device,app-cache' });

class SimulatorAppCache {
  constructor({ applesimutils, rootDir = getDetoxAppsCachePath() }) {
    this.applesimutils = applesimutils;
    this.rootDir = rootDir;
    this.cleanDeviceIds = new Set();
  }

  /**
   * Add an app to cache from a binary path
   * @param {string} deviceId - The device identifier
   * @param {string} bundleId - The app's bundle identifier
   * @param {string} binaryPath - Path to the app binary
   */
  async add(deviceId, bundleId, binaryPath) {
    log.trace({ deviceId }, `Caching app (${bundleId}) from binary path: ${binaryPath}`);

    const cacheAppPath = this._getAppCachePath(deviceId, bundleId);
    await fse.ensureDir(path.dirname(cacheAppPath));
    await fse.remove(cacheAppPath);
    await fse.copy(binaryPath, cacheAppPath);
  }

  /**
   * Back up an app to cache, if it is not already cached
   * @param {string} deviceId - The device identifier
   * @param {string} bundleId - The app's bundle identifier
   */
  async backup(deviceId, bundleId) {
    const appContainerPath = await this.applesimutils.getAppContainer(deviceId, bundleId).catch((reason) => {
      throw new DetoxRuntimeError({
        message: `App with bundle ID '${bundleId}' is not installed on this device (${deviceId}). Please install the app first before attempting to reset its state.`,
        hint: `To check apps installed on the device, use: xcrun simctl listapps ${deviceId}`,
        debugInfo: reason,
      });
    });

    if (!await this.exists(deviceId, bundleId)) {
      await this.add(deviceId, bundleId, appContainerPath);
    }
  }

  /**
   * Restore an app from cache
   * @param {string} deviceId - The device identifier
   * @param {string} bundleId - The app's bundle identifier
   * @returns {Promise<void>}
   */
  async restore(deviceId, bundleId) {
    log.trace(`Restoring app (${bundleId}) from cache to device (${deviceId})`);

    const cacheAppPath = this._getAppCachePath(deviceId, bundleId);

    if (!await fse.exists(cacheAppPath)) {
      throw new DetoxInternalError(`No backup found for bundle ID '${bundleId}' on device ${deviceId}. This should not happen unless you're calling SimulatorAppCache#restore() directly.`);
    }

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
      if (await fse.remove(cacheAppPath)) {
        log.trace({ path: cacheAppPath }, `Removed cached app (${bundleId}) for device (${deviceId})`);
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
      const deviceCachePath = this._getDeviceCachePath(deviceId);
      if (await fse.remove(deviceCachePath)) {
        log.trace({ path: deviceCachePath }, `Cleaned up the app cache for device (${deviceId})`);
      }
    } catch (err) {
      log.warn({ err }, `Failed to cleanup app cache for device ${deviceId}`);
    }

    this.cleanDeviceIds.add(deviceId);
  }

  /**
   * Clean up cache for a device only once per instance.
   * If the device has already been cleaned, this is a no-op.
   *
   * @param {string} deviceId - The device identifier
   * @returns {Promise<void>}
   */
  async cleanupOnce(deviceId) {
    if (!this.cleanDeviceIds.has(deviceId)) {
      await this.cleanup(deviceId);
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
