const exec = require('child-process-promise').exec;
const path = require('path');
const fs = require('fs');
const os = require('os');
const _ = require('lodash');
const IosDriver = require('./IosDriver');
const FBsimctl = require('./Fbsimctl');
const AppleSimUtils = require('./AppleSimUtils');
const configuration = require('../configuration');

class SimulatorDriver extends IosDriver {

  constructor(client) {
    super(client);
    this._fbsimctl = new FBsimctl();
    this._applesimutils = new AppleSimUtils();
  }

  async acquireFreeDevice(name) {
    return await this._fbsimctl.list(name);
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
    await this._fbsimctl.boot(deviceId);
  }

  async installApp(deviceId, binaryPath) {
    await this._fbsimctl.install(deviceId, binaryPath);
  }

  async uninstallApp(deviceId, bundleId) {
    await this._fbsimctl.uninstall(deviceId, bundleId);
  }

  async launch(deviceId, bundleId, launchArgs) {
    return await this._fbsimctl.launch(deviceId, bundleId, launchArgs);
  }

  async terminate(deviceId, bundleId) {
    await this._fbsimctl.terminate(deviceId, bundleId);
  }

  async sendToHome(deviceId) {
    return await this._fbsimctl.sendToHome(deviceId);
  }

  async shutdown(deviceId) {
    await this._fbsimctl.shutdown(deviceId);
  }

  async setLocation(deviceId, lat, lon) {
    await this._fbsimctl.setLocation(deviceId, lat, lon);
  }

  async setPermissions(deviceId, bundleId, permissions) {
    await this._applesimutils.setPermissions(deviceId, bundleId, permissions);
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
    return this._fbsimctl.getLogsPaths(deviceId);
  }
}

module.exports = SimulatorDriver;
