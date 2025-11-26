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
    // Get device info from Detox internals
    const { device: deviceHandle } = require('detox');
    
    // Check if we're on iOS first
    if (deviceHandle && deviceHandle.getPlatform && deviceHandle.getPlatform() !== 'ios') {
      cachedIOSVersion = null;
      return null;
    }
    
    // Try to get the device cookie which contains OS version info
    if (deviceHandle && deviceHandle._device && deviceHandle._device.deviceConfig) {
      const osVersion = deviceHandle._device.deviceConfig.device?.os;
      if (osVersion) {
        const majorVersion = parseInt(osVersion.split('.')[0], 10);
        cachedIOSVersion = majorVersion;
        return majorVersion;
      }
    }
  } catch (e) {
    // Fallback: If we can't determine version, assume iOS 18+ behavior
    console.warn('Could not determine iOS version, assuming iOS 18+');
  }

  // Default to 18 (safer assumption for modern iOS)
  cachedIOSVersion = 18;
  return cachedIOSVersion;
}

/**
 * Checks if iOS version is 18 or higher
 * @returns {Promise<boolean>}
 */
async function isIOS18OrHigher() {
  const majorVersion = await getIOSMajorVersion();
  
  // If not iOS (null), return false
  if (majorVersion === null) {
    return false;
  }
  
  return majorVersion >= 18;
}

module.exports = {
  getIOSMajorVersion,
  isIOS18OrHigher,
};


