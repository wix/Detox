/**
 * Utility to get device OS version information
 */

let cachedIOSVersion = null;

/**
 * Gets the iOS major version number
 * @returns {Promise<number|null>} The iOS major version (e.g., 17, 18, 26) or null if not iOS
 */
async function getIOSMajorVersion() {
  if (cachedIOSVersion !== null) {
    return cachedIOSVersion;
  }

  try {
    const { device: deviceHandle } = require('detox');
    if (deviceHandle && deviceHandle.getPlatform && deviceHandle.getPlatform() !== 'ios') {
      cachedIOSVersion = null;
      return null;
    }

    if (deviceHandle && deviceHandle._device && deviceHandle._device.deviceConfig) {
      const osVersion = deviceHandle._device.deviceConfig.device?.os;
      if (osVersion) {
        const majorVersion = parseInt(osVersion.split('.')[0], 10);
        cachedIOSVersion = majorVersion;
        return majorVersion;
      }
    }
  } catch (e) {
    console.warn('Could not determine iOS version, assuming iOS 18+');
  }

  cachedIOSVersion = 18;
  return cachedIOSVersion;
}

/**
 * Checks if iOS version is 18 or higher
 * @returns {Promise<boolean>}
 */
async function isIOS18OrHigher() {
  const majorVersion = await getIOSMajorVersion();
  if (majorVersion === null) {
    return false;
  }
  return majorVersion >= 18;
}

module.exports = {
  getIOSMajorVersion,
  isIOS18OrHigher,
};


