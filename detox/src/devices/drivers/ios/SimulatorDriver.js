const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const exec = require('child-process-promise').exec;
const IosDriver = require('./IosDriver');
const SimulatorDeviceId = require('./SimulatorDeviceId');
const DeviceRegistry = require('../../DeviceRegistry');
const AppleSimUtils = require('./tools/AppleSimUtils');
const SimulatorInstrumentsPlugin = require('../../../artifacts/instruments/ios/SimulatorInstrumentsPlugin');
const SimulatorLogPlugin = require('../../../artifacts/log/ios/SimulatorLogPlugin');
const SimulatorRecordVideoPlugin = require('../../../artifacts/video/SimulatorRecordVideoPlugin');
const SimulatorScreenshotPlugin = require('../../../artifacts/screenshot/SimulatorScreenshotPlugin');
const temporaryPath = require('../../../artifacts/utils/temporaryPath');
const DetoxRuntimeError = require('../../../errors/DetoxRuntimeError');
const environment = require('../../../utils/environment');
const argparse = require('../../../utils/argparse');
const getAbsoluteBinaryPath = require('../../../utils/getAbsoluteBinaryPath');
const log = require('../../../utils/logger').child({ __filename });
const pressAnyKey = require('../../../utils/pressAnyKey');

class SimulatorDriver extends IosDriver {

  constructor(config) {
    super(config);

    this.applesimutils = new AppleSimUtils();
    this.deviceRegistry = DeviceRegistry.forIOS();
  }

  declareArtifactPlugins() {
    const appleSimUtils = this.applesimutils;
    const client = this.client;

    return {
      ...super.declareArtifactPlugins(),

      log: (api) => new SimulatorLogPlugin({ api, appleSimUtils }),
      screenshot: (api) => new SimulatorScreenshotPlugin({ api, appleSimUtils }),
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

  /**
   * @param deviceId {SimulatorDeviceId}
   * @param bundleId {String}
   * @returns {Promise<void>}
   */
  async cleanup(deviceId, bundleId) {
    await this.deviceRegistry.disposeDevice(deviceId);
    await super.cleanup(deviceId, bundleId);
  }

  /**
   * @param deviceQuery {Object | String}
   * @returns {Promise<SimulatorDeviceId>}
   */
  async acquireFreeDevice(deviceQuery) {
    const udid = await this.deviceRegistry.allocateDevice(async () => {
      return await this._findOrCreateDevice(deviceQuery);
    });

    const deviceComment = this._commentDevice(deviceQuery);
    if (!udid) {
      throw new DetoxRuntimeError(`Failed to find device matching ${deviceComment}`);
    }

    await this._boot(udid, deviceQuery.type || deviceQuery);
    return new SimulatorDeviceId(udid, deviceComment);
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

  async _boot(udid, type) {
    const deviceLaunchArgs = argparse.getArgValue('deviceLaunchArgs');
    const coldBoot = await this.applesimutils.boot(udid, deviceLaunchArgs);
    await this.emitter.emit('bootDevice', { coldBoot, deviceId: udid, type });
  }

  /**
   * @param deviceId {SimulatorDeviceId}
   * @param binaryPath {String}
   * @returns {Promise<void>}
   */
  async installApp(deviceId, binaryPath) {
    await this.applesimutils.install(deviceId.udid, getAbsoluteBinaryPath(binaryPath));
  }

  /**
   * @param deviceId {SimulatorDeviceId}
   * @param bundleId {String}
   * @returns {Promise<void>}
   */
  async uninstallApp(deviceId, bundleId) {
    const { udid } = deviceId;
    await this.emitter.emit('beforeUninstallApp', { deviceId: udid, bundleId });
    await this.applesimutils.uninstall(udid, bundleId);
  }

  /**
   * @param deviceId {SimulatorDeviceId}
   * @param bundleId {String}
   * @param launchArgs {Object}
   * @param languageAndLocale {String}
   * @returns {Promise<number>} The app's PID
   */
  async launchApp(deviceId, bundleId, launchArgs, languageAndLocale) {
    const { udid } = deviceId;
    await this.emitter.emit('beforeLaunchApp', {bundleId, deviceId: udid, launchArgs});
    const pid = await this.applesimutils.launch(udid, bundleId, launchArgs, languageAndLocale);
    await this.emitter.emit('launchApp', {bundleId, deviceId: udid, launchArgs, pid});

    return pid;
  }

  /**
   * @param deviceId {SimulatorDeviceId}
   * @param bundleId {String}
   * @param launchArgs {Object}
   * @param languageAndLocale {String}
   * @returns {Promise<*|number>}
   */
  async waitForAppLaunch(deviceId, bundleId, launchArgs, languageAndLocale) {
    const { udid } = deviceId;

    await this.emitter.emit('beforeLaunchApp', {bundleId, deviceId: udid, launchArgs});

    this.applesimutils.printLaunchHint(udid, bundleId, launchArgs, languageAndLocale);
    await pressAnyKey();

    const pid = await this.applesimutils.getPid(udid, bundleId);
    if (Number.isNaN(pid)) {
      throw new DetoxRuntimeError({
        message: `Failed to find a process corresponding to the app bundle identifier (${bundleId}).`,
        hint: `Make sure that the app is running on the device (${udid}), visually or via CLI:\n` +
              `xcrun simctl spawn ${udid} launchctl list | grep -F '${bundleId}'\n`,
      });
    } else {
      log.info({}, `Found the app (${bundleId}) with process ID = ${pid}. Proceeding...`);
    }

    await this.emitter.emit('launchApp', {bundleId, deviceId: udid, launchArgs, pid});
    return pid;
  }

  /**
   * @param deviceId {SimulatorDeviceId}
   * @param bundleId {String}
   * @returns {Promise<void>}
   */
  async terminate(deviceId, bundleId) {
    const { udid } = deviceId;
    await this.emitter.emit('beforeTerminateApp', { deviceId: udid, bundleId });
    await this.applesimutils.terminate(udid, bundleId);
    await this.emitter.emit('terminateApp', { deviceId: udid, bundleId });
  }

  /**
   * @param deviceId {SimulatorDeviceId}
   * @param yesOrNo {Boolean}
   * @returns {Promise<void>}
   */
  async setBiometricEnrollment(deviceId, yesOrNo) {
    await this.applesimutils.setBiometricEnrollment(deviceId.udid, yesOrNo);
  }

  /**
   * @param deviceId {SimulatorDeviceId}
   * @returns {Promise<void>}
   */
  async matchFace(deviceId) {
    await this.applesimutils.matchBiometric(deviceId.udid, 'Face');
  }

  /**
   * @param deviceId {SimulatorDeviceId}
   * @returns {Promise<void>}
   */
  async unmatchFace(deviceId) {
    await this.applesimutils.unmatchBiometric(deviceId.udid, 'Face');
  }

  /**
   * @param deviceId {SimulatorDeviceId}
   * @returns {Promise<void>}
   */
  async matchFinger(deviceId) {
    await this.applesimutils.matchBiometric(deviceId.udid, 'Finger');
  }

  /**
   * @param deviceId {SimulatorDeviceId}
   * @returns {Promise<void>}
   */
  async unmatchFinger(deviceId) {
    await this.applesimutils.unmatchBiometric(deviceId.udid, 'Finger');
  }

  /**
   * @param deviceId {SimulatorDeviceId}
   * @returns {Promise<void>}
   */
  async sendToHome(deviceId) {
    await this.applesimutils.sendToHome(deviceId.udid);
  }

  /**
   * @param deviceId {SimulatorDeviceId}
   * @returns {Promise<void>}
   */
  async shutdown(deviceId) {
    const { udid } = deviceId;

    await this.emitter.emit('beforeShutdownDevice', { deviceId: udid });
    await this.applesimutils.shutdown(deviceId);
    await this.emitter.emit('shutdownDevice', { deviceId: udid });
  }

  /**
   * @param deviceId {SimulatorDeviceId}
   * @returns {Promise<void>}
   */
  async setLocation(deviceId, lat, lon) {
    await this.applesimutils.setLocation(deviceId.udid, lat, lon);
  }

  /**
   * @param deviceId {SimulatorDeviceId}
   * @param bundleId {String}
   * @param permissions {Object}
   * @returns {Promise<void>}
   */
  async setPermissions(deviceId, bundleId, permissions) {
    await this.applesimutils.setPermissions(deviceId.udid, bundleId, permissions);
  }

  /**
   * @param deviceId {SimulatorDeviceId}
   * @returns {Promise<void>}
   */
  async clearKeychain(deviceId) {
    await this.applesimutils.clearKeychain(deviceId.udid);
  }

  /**
   * @param deviceId {SimulatorDeviceId}
   * @returns {Promise<void>}
   */
  async resetContentAndSettings(deviceId) {
    const { udid } = deviceId;
    await this.shutdown(deviceId);
    await this.applesimutils.resetContentAndSettings(udid);
    await this._boot(udid);
  }

  async waitForActive() {
    return await this.client.waitForActive();
  }

  async waitForBackground() {
    return await this.client.waitForBackground();
  }

  /**
   * @param deviceId {SimulatorDeviceId}
   * @param screenshotName {String}
   * @returns {Promise<String>}
   */
  async takeScreenshot(deviceId, screenshotName) {
    const { udid } = deviceId;
    const tempPath = await temporaryPath.for.png();
    await this.applesimutils.takeScreenshot(udid, tempPath);

    await this.emitter.emit('createExternalArtifact', {
      pluginId: 'screenshot',
      artifactName: screenshotName || path.basename(tempPath, '.png'),
      artifactPath: tempPath,
    });

    return tempPath;
  }

  /**
   * @param deviceId {SimulatorDeviceId}
   * @param artifactName {String}
   * @returns {Promise<String>}
   */
  async captureViewHierarchy(deviceId, artifactName) {
    const viewHierarchyURL = temporaryPath.for.viewhierarchy();
    await this.client.captureViewHierarchy({ viewHierarchyURL });

    await this.emitter.emit('createExternalArtifact', {
      pluginId: 'uiHierarchy',
      artifactName: artifactName,
      artifactPath: viewHierarchyURL,
    });

    return viewHierarchyURL;
  }

  /**
   * @private
   * @param rawDeviceQuery {String | Object}
   * @returns {Promise<String>}
   */
  async _findOrCreateDevice(rawDeviceQuery) {
    let udid;

    const deviceQuery = this._adaptQuery(rawDeviceQuery);
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
    const { taken, free }  = _.groupBy(searchResults, ({ udid }) => takenDevices.includes(udid) ? 'taken' : 'free');

    const targetOS = _.get(taken, '0.os.identifier');
    const isMatching = targetOS && { os: { identifier: targetOS } };

    return {
      taken: _.filter(taken, isMatching),
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

  /**
   * @param deviceId {SimulatorDeviceId}
   * @param flags {Object}
   * @returns {Promise<void>}
   */
  async setStatusBar(deviceId, flags) {
    await this.applesimutils.statusBarOverride(deviceId, flags);
  }

  /**
   * @param deviceId {SimulatorDeviceId}
   * @returns {Promise<void>}
   */
  async resetStatusBar(deviceId) {
    await this.applesimutils.statusBarReset(deviceId);
  }
}

module.exports = SimulatorDriver;
