const exec = require('child-process-promise').exec;
const path = require('path');
const fs = require('fs');
const os = require('os');
const _ = require('lodash');
const IosDriver = require('./IosDriver');
const AppleSimUtils = require('./AppleSimUtils');
const configuration = require('../configuration');

class SimulatorDriver extends IosDriver {

  constructor(client) {
    super(client);
    this._applesimutils = new AppleSimUtils();
  }

  async acquireFreeDevice(name) {
    return await this._applesimutils.findDeviceUDID(name);
  }

  async getBundleIdFromBinary(appPath) {
    try {
      const result = await exec(`/usr/libexec/PlistBuddy -c "Print CFBundleIdentifier" ${path.join(appPath, 'Info.plist')}`);
      return _.trim(result.stdout);
    } catch (ex) {
      throw new Error(`field CFBundleIdentifier not found inside Info.plist of app binary at ${appPath}`);
    }
  }

  async boot(deviceId) {
    await this._applesimutils.boot(deviceId);
  }

  async installApp(deviceId, binaryPath) {
    await this._applesimutils.install(deviceId, binaryPath);
  }

  async uninstallApp(deviceId, bundleId) {
    await this._applesimutils.uninstall(deviceId, bundleId);
  }

  async launch(deviceId, bundleId, launchArgs) {
    return await this._applesimutils.launch(deviceId, bundleId, launchArgs);
  }

  async terminate(deviceId, bundleId) {
    await this._applesimutils.terminate(deviceId, bundleId);
  }

  async sendToHome(deviceId) {
    return await this._applesimutils.sendToHome(deviceId);
  }

  async shutdown(deviceId) {
    await this._applesimutils.shutdown(deviceId);
  }

  async setLocation(deviceId, lat, lon) {
    await this._applesimutils.setLocation(deviceId, lat, lon);
  }

  async setPermissions(deviceId, bundleId, permissions) {
    await this._applesimutils.setPermissions(deviceId, bundleId, permissions);
  }

  async resetContentAndSettings(deviceId) {
    return await this._applesimutils.resetContentAndSettings(deviceId);
  }

  validateDeviceConfig(deviceConfig) {
    if (!deviceConfig.binaryPath) {
      configuration.throwOnEmptyBinaryPath();
    }

    if (!deviceConfig.name) {
      configuration.throwOnEmptyName();
    }
  }

  getLogsPaths(deviceId) {
    return this._applesimutils.getLogsPaths(deviceId);
  }
}

module.exports = SimulatorDriver;
