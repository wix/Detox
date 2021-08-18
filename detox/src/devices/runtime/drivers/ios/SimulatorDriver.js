const fs = require('fs');
const path = require('path');

const exec = require('child-process-promise').exec;
const _ = require('lodash');

const SimulatorInstrumentsPlugin = require('../../../../artifacts/instruments/ios/SimulatorInstrumentsPlugin');
const SimulatorLogPlugin = require('../../../../artifacts/log/ios/SimulatorLogPlugin');
const SimulatorScreenshotPlugin = require('../../../../artifacts/screenshot/SimulatorScreenshotPlugin');
const temporaryPath = require('../../../../artifacts/utils/temporaryPath');
const SimulatorRecordVideoPlugin = require('../../../../artifacts/video/SimulatorRecordVideoPlugin');
const DetoxRuntimeError = require('../../../../errors/DetoxRuntimeError');
const argparse = require('../../../../utils/argparse');
const environment = require('../../../../utils/environment');
const getAbsoluteBinaryPath = require('../../../../utils/getAbsoluteBinaryPath');
const log = require('../../../../utils/logger').child({ __filename });
const pressAnyKey = require('../../../../utils/pressAnyKey');
const DeviceRegistry = require('../../../DeviceRegistry');

const IosDriver = require('./IosDriver');
const AppleSimUtils = require('./tools/AppleSimUtils');

class SimulatorDriver extends IosDriver {
  /**
   * @param deviceCookie { IosSimulatorCookie }
   * @param config { Object }
   */
  constructor(deviceCookie, config) {
    super(deviceCookie, config);

    // TODO Can pass the UDID into apple-sim-utils via c'tor, now that it is available through the cookie
    this.applesimutils = new AppleSimUtils();
    this.deviceRegistry = DeviceRegistry.forIOS();
  }

  getExternalId() {
    return this.cookie.udid;
  }

  getDeviceName() {
    const { udid, type } = this.cookie;
    return `${udid} ${type}`;
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

  async cleanup(bundleId) {
    const { udid } = this.cookie;
    await this.deviceRegistry.disposeDevice(udid);
    await super.cleanup(bundleId);
  }

  async acquireFreeDevice(deviceQuery) {
    const udid = await this.deviceRegistry.allocateDevice(async () => {
      return await this._findOrCreateDevice(deviceQuery);
    });

    const deviceComment = this._commentDevice(deviceQuery);
    if (!udid) {
      throw new DetoxRuntimeError(`Failed to find device matching ${deviceComment}`);
    }

    try {
      await this._boot(udid, deviceQuery.type || deviceQuery);
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

  async _boot(deviceId, type) {
    const deviceLaunchArgs = argparse.getArgValue('deviceLaunchArgs');
    const coldBoot = await this.applesimutils.boot(deviceId, deviceLaunchArgs);
    await this.emitter.emit('bootDevice', { coldBoot, deviceId, type });
  }

  async installApp(binaryPath) {
    const { udid } = this.cookie;
    await this.applesimutils.install(udid, getAbsoluteBinaryPath(binaryPath));
  }

  async uninstallApp(bundleId) {
    const { udid } = this.cookie;
    await this.emitter.emit('beforeUninstallApp', { deviceId: udid, bundleId });
    await this.applesimutils.uninstall(udid, bundleId);
  }

  async launchApp(bundleId, launchArgs, languageAndLocale) {
    const { udid } = this.cookie;
    await this.emitter.emit('beforeLaunchApp', { bundleId, deviceId: udid, launchArgs });
    const pid = await this.applesimutils.launch(udid, bundleId, launchArgs, languageAndLocale);
    await this.emitter.emit('launchApp', { bundleId, deviceId: udid, launchArgs, pid });

    return pid;
  }

  async waitForAppLaunch(bundleId, launchArgs, languageAndLocale) {
    const { udid } = this.cookie;

    await this.emitter.emit('beforeLaunchApp', { bundleId, deviceId: udid, launchArgs });

    this.applesimutils.printLaunchHint(udid, bundleId, launchArgs, languageAndLocale);
    await pressAnyKey();

    const pid = await this.applesimutils.getPid(udid, bundleId);
    if (Number.isNaN(pid)) {
      throw new DetoxRuntimeError({
        message: `Failed to find a process corresponding to the app bundle identifier (${bundleId}).`,
        hint: `Make sure that the app is running on the device (${udid}), visually or via CLI:\n` +
              `xcrun simctl spawn ${deviceId} launchctl list | grep -F '${bundleId}'\n`,
      });
    } else {
      log.info({}, `Found the app (${bundleId}) with process ID = ${pid}. Proceeding...`);
    }

    await this.emitter.emit('launchApp', { bundleId, deviceId: udid, launchArgs, pid });
    return pid;
  }

  async terminate(bundleId) {
    const { udid } = this.cookie;
    await this.emitter.emit('beforeTerminateApp', { deviceId: udid, bundleId });
    await this.applesimutils.terminate(udid, bundleId);
    await this.emitter.emit('terminateApp', { deviceId: udid, bundleId });
  }

  async setBiometricEnrollment(yesOrNo) {
    const { udid } = this.cookie;
    await this.applesimutils.setBiometricEnrollment(udid, yesOrNo);
  }

  async matchFace() {
    const { udid } = this.cookie;
    await this.applesimutils.matchBiometric(udid, 'Face');
  }

  async unmatchFace() {
    const { udid } = this.cookie;
    await this.applesimutils.unmatchBiometric(udid, 'Face');
  }

  async matchFinger() {
    const { udid } = this.cookie;
    await this.applesimutils.matchBiometric(udid, 'Finger');
  }

  async unmatchFinger() {
    const { udid } = this.cookie;
    await this.applesimutils.unmatchBiometric(udid, 'Finger');
  }

  async sendToHome() {
    const { udid } = this.cookie;
    await this.applesimutils.sendToHome(udid);
  }

  async shutdown() {
    const { udid } = this.cookie;
    await this.emitter.emit('beforeShutdownDevice', { deviceId: udid });
    await this.applesimutils.shutdown(udid);
    await this.emitter.emit('shutdownDevice', { deviceId: udid });
  }

  async setLocation(lat, lon) {
    const { udid } = this.cookie;
    await this.applesimutils.setLocation(udid, lat, lon);
  }

  async setPermissions(bundleId, permissions) {
    const { udid } = this.cookie;
    await this.applesimutils.setPermissions(udid, bundleId, permissions);
  }

  async clearKeychain() {
    const { udid } = this.cookie;
    await this.applesimutils.clearKeychain(udid);
  }

  async resetContentAndSettings() {
    const { udid } = this.cookie;
    await this.shutdown();
    await this.applesimutils.resetContentAndSettings(udid);
    await this._boot(udid);
  }

  getLogsPaths() {
    const { udid } = this.cookie;
    return this.applesimutils.getLogsPaths(udid);
  }

  async waitForActive() {
    return await this.client.waitForActive();
  }

  async waitForBackground() {
    return await this.client.waitForBackground();
  }

  async takeScreenshot(screenshotName) {
    const { udid } = this.cookie;
    const tempPath = await temporaryPath.for.png();
    await this.applesimutils.takeScreenshot(udid, tempPath);

    await this.emitter.emit('createExternalArtifact', {
      pluginId: 'screenshot',
      artifactName: screenshotName || path.basename(tempPath, '.png'),
      artifactPath: tempPath,
    });

    return tempPath;
  }

  async captureViewHierarchy(artifactName) {
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
   * @param {String | Object} rawDeviceQuery
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

  async setStatusBar(flags) {
    const { udid } = this.cookie;
    await this.applesimutils.statusBarOverride(udid, flags);
  }

  async resetStatusBar() {
    const { udid } = this.cookie;
    await this.applesimutils.statusBarReset(udid);
  }
}

module.exports = SimulatorDriver;
