const fs = require('fs');
const path = require('path');

const exec = require('child-process-promise').exec;
const _ = require('lodash');

const SimulatorInstrumentsPlugin = require('../../../artifacts/instruments/ios/SimulatorInstrumentsPlugin');
const SimulatorLogPlugin = require('../../../artifacts/log/ios/SimulatorLogPlugin');
const SimulatorScreenshotPlugin = require('../../../artifacts/screenshot/SimulatorScreenshotPlugin');
const temporaryPath = require('../../../artifacts/utils/temporaryPath');
const SimulatorRecordVideoPlugin = require('../../../artifacts/video/SimulatorRecordVideoPlugin');
const DetoxRuntimeError = require('../../../errors/DetoxRuntimeError');
const environment = require('../../../utils/environment');
const getAbsoluteBinaryPath = require('../../../utils/getAbsoluteBinaryPath');
const log = require('../../../utils/logger').child({ __filename });
const pressAnyKey = require('../../../utils/pressAnyKey');
const DeviceRegistry = require('../../DeviceRegistry');

const IosDriver = require('./IosDriver');
const AppleSimUtils = require('./tools/AppleSimUtils');

class SimulatorDriver extends IosDriver {

  constructor(config) {
    super(config);

    this.applesimutils = new AppleSimUtils();
    this.deviceRegistry = DeviceRegistry.forIOS();
    this._name = 'Unspecified Simulator';
  }

  get name() {
    return this._name;
  }

  declareArtifactPlugins() {
    const appleSimUtils = this.applesimutils;
    const client = this.client;

    return {
      ...super.declareArtifactPlugins(),

      log: (api) => new SimulatorLogPlugin({ api, appleSimUtils }),
      screenshot: (api) => new SimulatorScreenshotPlugin({ api, appleSimUtils, client }),
      video: (api) => new SimulatorRecordVideoPlugin({ api, appleSimUtils }),
      instruments: (api) => new SimulatorInstrumentsPlugin({ api, client }),
    };
  }

  async prepare() {
    const detoxFrameworkPath = await environment.getFrameworkPath();

    if (!fs.existsSync(detoxFrameworkPath)) {
      throw new DetoxRuntimeError(`${detoxFrameworkPath} could not be found, this means either you changed a version of Xcode or Detox postinstall script was unsuccessful.
      To attempt a fix try running 'detox clean-framework-cache && detox build-framework-cache'`);
    }
  }

  async cleanup(deviceId, bundleId) {
    await this.deviceRegistry.disposeDevice(deviceId);
    await super.cleanup(deviceId, bundleId);
  }

  async acquireFreeDevice(_deviceQuery, deviceConfig) {
    const deviceQuery = this._adaptQuery(deviceConfig.device);
    const udid = await this.deviceRegistry.allocateDevice(async () => {
      return await this._findOrCreateDevice(deviceQuery);
    });

    const deviceComment = this._commentDevice(deviceQuery);
    if (!udid) {
      throw new DetoxRuntimeError(`Failed to find device matching ${deviceComment}`);
    }

    this._name = `${udid} ${deviceComment}`;

    try {
      await this._boot(udid, deviceConfig);
    } catch (e) {
      await this.deviceRegistry.disposeDevice(udid);
      throw e;
    }

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
      throw new DetoxRuntimeError(`field CFBundleIdentifier not found inside Info.plist of app binary at ${appPath}`);
    }
  }

  async _boot(deviceId, deviceConfig) {
    const coldBoot = await this.applesimutils.boot(deviceId, deviceConfig.bootArgs);
    await this.emitter.emit('bootDevice', { coldBoot, deviceId, type: deviceConfig.type });
  }

  async installApp(deviceId, binaryPath) {
    await this.applesimutils.install(deviceId, getAbsoluteBinaryPath(binaryPath));
  }

  async uninstallApp(deviceId, bundleId) {
    await this.emitter.emit('beforeUninstallApp', { deviceId, bundleId });
    await this.applesimutils.uninstall(deviceId, bundleId);
  }

  async launchApp(deviceId, bundleId, launchArgs, languageAndLocale) {
    await this.emitter.emit('beforeLaunchApp', { bundleId, deviceId, launchArgs });
    const pid = await this.applesimutils.launch(deviceId, bundleId, launchArgs, languageAndLocale);
    await this.emitter.emit('launchApp', { bundleId, deviceId, launchArgs, pid });

    return pid;
  }

  async waitForAppLaunch(deviceId, bundleId, launchArgs, languageAndLocale) {
    await this.emitter.emit('beforeLaunchApp', { bundleId, deviceId, launchArgs });

    this.applesimutils.printLaunchHint(deviceId, bundleId, launchArgs, languageAndLocale);
    await pressAnyKey();

    const pid = await this.applesimutils.getPid(deviceId, bundleId);
    if (Number.isNaN(pid)) {
      throw new DetoxRuntimeError({
        message: `Failed to find a process corresponding to the app bundle identifier (${bundleId}).`,
        hint: `Make sure that the app is running on the device (${deviceId}), visually or via CLI:\n` +
              `xcrun simctl spawn ${deviceId} launchctl list | grep -F '${bundleId}'\n`,
      });
    } else {
      log.info({}, `Found the app (${bundleId}) with process ID = ${pid}. Proceeding...`);
    }

    await this.emitter.emit('launchApp', { bundleId, deviceId, launchArgs, pid });
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
    await this.applesimutils.clearKeychain(deviceId);
  }

  async resetContentAndSettings(deviceId, deviceConfig) {
    await this.shutdown(deviceId);
    await this.applesimutils.resetContentAndSettings(deviceId);
    await this._boot(deviceId, deviceConfig);
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
      artifactName: screenshotName || path.basename(tempPath, '.png'),
      artifactPath: tempPath,
    });

    return tempPath;
  }

  async captureViewHierarchy(_udid, artifactName) {
    const viewHierarchyURL = temporaryPath.for.viewhierarchy();
    await this.client.captureViewHierarchy({ viewHierarchyURL });

    await this.emitter.emit('createExternalArtifact', {
      pluginId: 'uiHierarchy',
      artifactName: artifactName,
      artifactPath: viewHierarchyURL,
    });

    return viewHierarchyURL;
  }

  /***
   * @private
   * @param {{
   *   byId?: string;
   *   byName?: string;
   *   byType?: string;
   *   byOS?: string;
   * }} deviceQuery
   * @returns {Promise<String>}
   */
  async _findOrCreateDevice(deviceQuery) {
    let udid;

    const { free, taken } = await this._groupDevicesByStatus(deviceQuery);

    if (_.isEmpty(free)) {
      const prototypeDevice = taken[0];
      udid = this.applesimutils.create(prototypeDevice);
    } else {
      udid = free[0].udid;
    }

    return udid;
  }

  async _groupDevicesByStatus(deviceQuery) {
    const searchResults = await this._queryDevices(deviceQuery);
    const { rawDevices: takenDevices } = this.deviceRegistry.getRegisteredDevices();
    const takenUDIDs = _.map(takenDevices, 'id');
    const { taken, free }  = _.groupBy(searchResults, ({ udid }) => takenUDIDs.includes(udid) ? 'taken' : 'free');

    const targetOS = _.get(taken, '0.os.identifier');
    const isMatching = targetOS && { os: { identifier: targetOS } };

    return {
      taken: _.filter(taken, isMatching),
      free: _.filter(free, isMatching),
    };
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

  _adaptQuery({ id, name, os, type }) {
    return _.omitBy({
      byId: id,
      byName: name,
      byOS: os,
      byType: type,
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

  _commentDevice({ byId, byName, byOS, byType }) {
    return byId || _.compact([byName, byType, byOS]).join(', ');
  }

  async setStatusBar(deviceId, flags) {
    await this.applesimutils.statusBarOverride(deviceId, flags);
  }

  async resetStatusBar(deviceId) {
    await this.applesimutils.statusBarReset(deviceId);
  }
}

module.exports = SimulatorDriver;
