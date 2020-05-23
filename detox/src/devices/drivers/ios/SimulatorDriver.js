const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const exec = require('child-process-promise').exec;
const DeviceRegistry = require('../../DeviceRegistry');
const IosDriver = require('./IosDriver');
const temporaryPath = require('../../../artifacts/utils/temporaryPath');
const DetoxConfigError = require('../../../errors/DetoxConfigError');
const DetoxRuntimeError = require('../../../errors/DetoxRuntimeError');
const environment = require('../../../utils/environment');
const argparse = require('../../../utils/argparse');
const getAbsoluteBinaryPath = require('../../../utils/getAbsoluteBinaryPath');

class SimulatorDriver extends IosDriver {

  constructor(config) {
    super(config);

    this.deviceRegistry = new DeviceRegistry({
      lockfilePath: environment.getDeviceLockFilePathIOS(),
    });

    this._name = 'Unspecified Simulator';
  }

  get name() {
    return this._name;
  }

  async prepare() {
    const detoxFrameworkPath = await environment.getFrameworkPath();

    if (!fs.existsSync(detoxFrameworkPath)) {
      throw new Error(`${detoxFrameworkPath} could not be found, this means either you changed a version of Xcode or Detox postinstall script was unsuccessful.
      To attempt a fix try running 'detox clean-framework-cache && detox build-framework-cache'`);
    }
  }

  async cleanup(deviceId, bundleId) {
    await this.deviceRegistry.disposeDevice(deviceId);
    await super.cleanup(deviceId, bundleId);
  }

  async acquireFreeDevice(deviceQuery) {
    const udid = await this.deviceRegistry.allocateDevice(async () => {
      return await this._findOrCreateDevice(deviceQuery);
    });

    const deviceComment = this._commentDevice(deviceQuery);
    if (!udid) {
      throw new Error(`Failed to find device matching ${deviceComment}`);
    }

    await this._boot(udid, deviceQuery.type || deviceQuery);
    this._name = `${udid} ${deviceComment}`;
    return udid;
  }

  async getBundleIdFromBinary(appPath) {
    appPath = getAbsoluteBinaryPath(appPath);
    try {
      const result = await exec(`/usr/libexec/PlistBuddy -c "Print CFBundleIdentifier" "${path.join(appPath, 'Info.plist')}"`);
      const bundleId = _.trim(result.stdout);
      if (_.isEmpty(bundleId)) {
        throw new Error();
      }
      return bundleId;
    } catch (ex) {
      throw new Error(`field CFBundleIdentifier not found inside Info.plist of app binary at ${appPath}`);
    }
  }

  async _boot(deviceId, type) {
    const deviceLaunchArgs = argparse.getArgValue('deviceLaunchArgs');
    const coldBoot = await this.applesimutils.boot(deviceId, deviceLaunchArgs);
    await this.emitter.emit('bootDevice', { coldBoot, deviceId, type });
  }

  async installApp(deviceId, binaryPath) {
    await this.applesimutils.install(deviceId, getAbsoluteBinaryPath(binaryPath));
  }

  async uninstallApp(deviceId, bundleId) {
    await this.emitter.emit('beforeUninstallApp', { deviceId, bundleId });
    await this.applesimutils.uninstall(deviceId, bundleId);
  }

  async launchApp(deviceId, bundleId, launchArgs, languageAndLocale) {
    await this.emitter.emit('beforeLaunchApp', {bundleId, deviceId, launchArgs});
    const pid = await this.applesimutils.launch(deviceId, bundleId, launchArgs, languageAndLocale);
    await this.emitter.emit('launchApp', {bundleId, deviceId, launchArgs, pid});

    return pid;
  }

  async terminate(deviceId, bundleId) {
    await this.emitter.emit('beforeTerminateApp', { deviceId, bundleId });
    await this.applesimutils.terminate(deviceId, bundleId);
    await this.emitter.emit('terminateApp', { deviceId, bundleId });
  }

  async setBiometricEnrollment(deviceId, yesOrNo) {
    await this.applesimutils.setBiometricEnrollment(deviceId, yesOrNo);
  }

  async matchFace(deviceId) {
    await this.applesimutils.matchBiometric(deviceId, 'Face');
  }

  async unmatchFace(deviceId) {
    await this.applesimutils.unmatchBiometric(deviceId, 'Face');
  }

  async matchFinger(deviceId) {
    await this.applesimutils.matchBiometric(deviceId, 'Finger');
  }

  async unmatchFinger(deviceId) {
    await this.applesimutils.unmatchBiometric(deviceId, 'Finger');
  }

  async sendToHome(deviceId) {
    await this.applesimutils.sendToHome(deviceId);
  }

  async shutdown(deviceId) {
    await this.emitter.emit('beforeShutdownDevice', { deviceId });
    await this.applesimutils.shutdown(deviceId);
    await this.emitter.emit('shutdownDevice', { deviceId });
  }

  async setLocation(deviceId, lat, lon) {
    await this.applesimutils.setLocation(deviceId, lat, lon);
  }

  async setPermissions(deviceId, bundleId, permissions) {
    await this.applesimutils.setPermissions(deviceId, bundleId, permissions);
  }

  async clearKeychain(deviceId) {
    await this.applesimutils.clearKeychain(deviceId)
  }

  async resetContentAndSettings(deviceId) {
    await this.shutdown(deviceId);
    await this.applesimutils.resetContentAndSettings(deviceId);
    await this._boot(deviceId);
  }

  validateDeviceConfig(deviceConfig) {
    if (!deviceConfig.binaryPath) {
      throw new DetoxConfigError({
        message: `'binaryPath' property is missing, should hold the app binary path`,
        hint: 'Check again your device config:',
        debugInfo: deviceConfig,
      });
    }
  }

  getLogsPaths(deviceId) {
    return this.applesimutils.getLogsPaths(deviceId);
  }

  async waitForActive() {
    return await this.client.waitForActive();
  }

  async waitForBackground() {
    return await this.client.waitForBackground();
  }

  async takeScreenshot(udid, screenshotName) {
    const tempPath = await temporaryPath.for.png();
    await this.applesimutils.takeScreenshot(udid, tempPath);

    await this.emitter.emit('createExternalArtifact', {
      pluginId: 'screenshot',
      artifactName: screenshotName,
      artifactPath: tempPath,
    });

    return tempPath;
  }

  /***
   * @private
   * @param {String | Object} rawDeviceQuery
   * @returns {Promise<String>}
   */
  async _findOrCreateDevice(rawDeviceQuery) {
    let udid;

    const deviceQuery = this._adaptQuery(rawDeviceQuery);
    const { free, busy } = await this._groupDevicesByStatus(deviceQuery);

    if (_.isEmpty(free)) {
      const prototypeDevice = busy[0];
      udid = this.applesimutils.create(prototypeDevice);
    } else {
      udid = free[0].udid;
    }

    return udid;
  }

  async _groupDevicesByStatus(deviceQuery) {
    const searchResults = await this._queryDevices(deviceQuery);

    const { busy, free}  = _.groupBy(searchResults, device => {
      return this.deviceRegistry.isDeviceBusy(device.udid)
        ? 'busy'
        : 'free';
    });

    const targetOS = _.get(busy, '0.os.identifier');
    const isMatching = targetOS && { os: { identifier: targetOS } };

    return {
      busy: _.filter(busy, isMatching),
      free: _.filter(free, isMatching),
    }
  }

  async _queryDevices(deviceQuery) {
    const result = await this.applesimutils.list(
      deviceQuery,
      `Searching for device ${this._commentQuery(deviceQuery)} ...`
    );

    if (_.isEmpty(result)) {
      throw new DetoxRuntimeError({
        message: `Failed to find a device ${this._commentQuery(deviceQuery)}`,
        hint: `Run 'applesimutils --list' to list your supported devices. ` +
              `It is advised only to specify a device type, e.g., "iPhone Xʀ" and avoid explicit search by OS version.`
      });
    }

    return result;
  }

  _adaptQuery(rawDeviceQuery) {
    let byId, byName, byOS, byType;

    if (_.isPlainObject(rawDeviceQuery)) {
      byId = rawDeviceQuery.id;
      byName = rawDeviceQuery.name;
      byOS = rawDeviceQuery.os;
      byType = rawDeviceQuery.type;
    } else {
      if (_.includes(rawDeviceQuery, ',')) {
        [byType, byOS] = _.split(rawDeviceQuery, /\s*,\s*/);
      } else {
        byType = rawDeviceQuery;
      }
    }

    return _.omitBy({
      byId,
      byName,
      byOS,
      byType,
    }, _.isUndefined);
  }

  _commentQuery({ byId, byName, byOS, byType }) {
    return _.compact([
      byId && `by UDID = ${JSON.stringify(byId)}`,
      byName && `by name = ${JSON.stringify(byName)}`,
      byType && `by type = ${JSON.stringify(byType)}`,
      byOS && `by OS = ${JSON.stringify(byOS)}`,
    ]).join(' and ');
  }

  _commentDevice(rawDeviceQuery) {
    return _.isPlainObject(rawDeviceQuery)
      ? JSON.stringify(rawDeviceQuery)
      : `(${rawDeviceQuery})`;
  }

  async setStatusBar(deviceId, flags) {
    await this.applesimutils.statusBarOverride(deviceId, flags);
  }

  async resetStatusBar(deviceId) {
    await this.applesimutils.statusBarReset(deviceId);
  }
}

module.exports = SimulatorDriver;
