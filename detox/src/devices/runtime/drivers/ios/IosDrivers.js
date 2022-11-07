const path = require('path');

const exec = require('child-process-promise').exec;
const _ = require('lodash');

const DetoxRuntimeError = require('../../../../errors/DetoxRuntimeError');
const getAbsoluteBinaryPath = require('../../../../utils/getAbsoluteBinaryPath');
const { DeviceDriver, TestAppDriver } = require('../BaseDrivers');

class IosDeviceDriver extends DeviceDriver {
  /** @override */
  get platform() {
    return 'ios';
  }
}

/**
 * @typedef { AppInfo } IosAppInfo
 */

class IosAppDriver extends TestAppDriver {
  /**
   * @param deps { TestAppDriverDeps }
   */
  constructor(deps) {
    super(deps);

    this._inferBundleIdFromBinary = _.memoize(this._inferBundleIdFromBinary.bind(this), (appInfo) => appInfo.binaryPath);
  }

  /**
   * @override
   * @param appInfo { IosAppInfo }
   */
  async select(appInfo) {
    await super.select(appInfo);

    this.bundleId = await this._inferBundleIdFromBinary(appInfo.binaryPath);
  }

  /** @override */
  async deselect() {
    // We do not yet support concurrently running apps on iOS, so - keeping the legacy behavior,
    // we must terminate if we're not the selected ones.
    if (this.isRunning()) {
      await this.terminate();
    }
  }

  /** @override */
  async openURL(params) {
    return this._deliverPayload(params);
  }

  /** @override */
  async reloadReactNative() {
    return this.client.reloadReactNative();
  }

  /** @override */
  async setOrientation(orientation) {
    if (!['portrait', 'landscape'].some(option => option === orientation)) {
      const message = `orientation should be either 'portrait' or 'landscape', but got (${orientation})`;
      throw new DetoxRuntimeError({ message });
    }
    await this.client.setOrientation({ orientation });
  }

  /** @override */
  async shake() {
    await this.client.shake();
    await this._waitForActive();
  }

  async _inferBundleIdFromBinary(appPath) {
    appPath = getAbsoluteBinaryPath(appPath);
    try {
      const result = await exec(`/usr/libexec/PlistBuddy -c "Print CFBundleIdentifier" "${path.join(appPath, 'Info.plist')}"`);
      const bundleId = _.trim(result.stdout);
      if (_.isEmpty(bundleId)) {
        throw new Error();
      }
      return bundleId;
    } catch (ex) {
      throw new DetoxRuntimeError({ message: `field CFBundleIdentifier not found inside Info.plist of app binary at ${appPath}` });
    }
  }

  async _deliverPayload(payload) {
    return this.client.deliverPayload(payload);
  }

  async _waitForActive() {
    return await this.client.waitForActive();
  }
}


module.exports = {
  IosDeviceDriver,
  IosAppDriver,
};
