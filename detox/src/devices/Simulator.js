const exec = require('child-process-promise').exec;
const path = require('path');
const fs = require('fs');
const os = require('os');
const _ = require('lodash');
const IosNoneDevice = require('./IosNoneDevice');
const FBsimctl = require('./Fbsimctl');
const AppleSimUtils = require('./AppleSimUtils');
const configuration = require('../configuration');
const argparse = require('../utils/argparse');
const invoke = require('../invoke');

class Simulator extends IosNoneDevice {

  constructor(client, session, deviceConfig) {
    super(client, session, deviceConfig);
    this._fbsimctl = new FBsimctl();
    this._applesimutils = new AppleSimUtils();
    this._simulatorUdid = "";
    this.sim = "";
  }

  validate(deviceConfig) {
    super.validate(deviceConfig);

    if (!deviceConfig.binaryPath) {
      configuration.throwOnEmptyBinaryPath();
    }

    if (!deviceConfig.name) {
      configuration.throwOnEmptyName();
    }
  }

  async _getBundleIdFromApp(appPath) {
    const absPath = this._getAppAbsolutePath(appPath);
    try {
      const result = await exec(`/usr/libexec/PlistBuddy -c "Print CFBundleIdentifier" ${path.join(absPath, 'Info.plist')}`);
      return _.trim(result.stdout);
    } catch (ex) {
      throw new Error(`field CFBundleIdentifier not found inside Info.plist of app binary at ${absPath}`);
    }
  }

  _getAppAbsolutePath(appPath) {
    const absPath = path.join(process.cwd(), appPath);
    if (fs.existsSync(absPath)) {
      return absPath;
    } else {
      throw new Error(`app binary not found at ${absPath}, did you build it?`);
    }
  }

  async prepare() {
    this._simulatorUdid = await this._fbsimctl.list(this._deviceConfig.name);
    this._bundleId = await this._getBundleIdFromApp(this._deviceConfig.binaryPath);
    await this._fbsimctl.boot(this._simulatorUdid);
    await this.relaunchApp({delete: !argparse.getArgValue('reuse')});
  }

  async relaunchApp(params = {}, bundleId) {
    if (params.url && params.userNotification) {
      throw new Error(`detox can't understand this 'relaunchApp(${JSON.stringify(params)})' request, either request to launch with url or with userNotification, not both`);
    }

    if (params.delete) {
      await this._fbsimctl.uninstall(this._simulatorUdid, this._bundleId);
      await this._fbsimctl.install(this._simulatorUdid, this._getAppAbsolutePath(this._deviceConfig.binaryPath));
    } else {
      // Calling `relaunch` is not good as it seems `fbsimctl` does not forward env variables in this mode.
      await this._fbsimctl.terminate(this._simulatorUdid, this._bundleId);
    }

    if (params.permissions) {
      await this._applesimutils.setPermissions(this._simulatorUdid, this._bundleId, params.permissions);
    }

    let additionalLaunchArgs;
    if (params.url) {
      additionalLaunchArgs = {'-detoxURLOverride': params.url};
    } else if (params.userNotification) {
      additionalLaunchArgs = {'-detoxUserNotificationDataURL': this.createPushNotificationJson(params.userNotification)};
    }

    const _bundleId = bundleId || this._bundleId;
    await this._fbsimctl.launch(this._simulatorUdid, _bundleId, this._prepareLaunchArgs(additionalLaunchArgs));
    await this.client.waitUntilReady();
  }

  async installApp(binaryPath) {
    const _binaryPath = binaryPath || this._getAppAbsolutePath(this._deviceConfig.binaryPath);
    await this._fbsimctl.install(this._simulatorUdid, _binaryPath);
  }

  async uninstallApp(bundleId) {
    const _bundleId = bundleId || this._bundleId;
    await this._fbsimctl.uninstall(this._simulatorUdid, _bundleId);
  }

  async openURL(url) {
    await this._fbsimctl.open(this._simulatorUdid, url);
  }

  async shutdown() {
    await this._fbsimctl.shutdown(this._simulatorUdid);
  }

  async setOrientation(orientation) {
    // keys are possible orientations
    const orientationMapping = {
      landscape: 3, // top at left side landscape
      portrait: 1  // non-reversed portrait
    };
    if (!Object.keys(orientationMapping).includes(orientation)) {
      throw new Error(`setOrientation failed: provided orientation ${orientation} is not part of supported orientations: ${Object.keys(orientationMapping)}`)
    }

    const call = invoke.call(invoke.EarlGrey.instance,
      'rotateDeviceToOrientation:errorOrNil:',
      invoke.IOS.NSInteger(orientationMapping[orientation])
    );
    await this.client.execute(call);
  }

  async setLocation(lat, lon) {
    await this._fbsimctl.setLocation(this._simulatorUdid, lat, lon);
  }
}

module.exports = Simulator;
