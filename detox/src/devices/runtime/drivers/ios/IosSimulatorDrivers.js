// @ts-nocheck
const path = require('path');

const _ = require('lodash');

const temporaryPath = require('../../../../artifacts/utils/temporaryPath');
const DetoxRuntimeError = require('../../../../errors/DetoxRuntimeError');
const log = require('../../../../utils/logger').child({ __filename });
const pressAnyKey = require('../../../../utils/pressAnyKey');
const tempFile = require('../../../../utils/tempFile');

const { IosDeviceDriver, IosAppDriver } = require('./IosDrivers');

/**
 * @typedef SimulatorDriverDeps
 * @property simulatorLauncher { SimulatorLauncher }
 * @property applesimutils { AppleSimUtils }
 */

/**
 * @typedef SimulatorDriverProps
 * @property udid { String } The unique cross-OS identifier of the simulator
 * @property type { String }
 * @property bootArgs { Object }
 */

class IosSimulatorDeviceDriver extends IosDeviceDriver {
  /**
   * @param deps { SimulatorDriverDeps }
   * @param props { SimulatorDriverProps }
   */
  constructor(deps, { udid, type, bootArgs }) {
    super(deps);

    this.udid = udid;
    this._type = type;
    this._bootArgs = bootArgs;
    this._deviceName = `${udid} (${this._type})`;

    this._simulatorLauncher = deps.simulatorLauncher;
    this._applesimutils = deps.applesimutils;
  }

  /** @override */
  get externalId() {
    return this.udid;
  }

  /** @override */
  get deviceName() {
    return this._deviceName;
  }

  /** @override */
  async setBiometricEnrollment(yesOrNo) {
    await this._applesimutils.setBiometricEnrollment(this.udid, yesOrNo);
  }

  /** @override */
  async setLocation(lat, lon) {
    await this._applesimutils.setLocation(this.udid, lat, lon);
  }

  /** @override */
  async clearKeychain() {
    await this._applesimutils.clearKeychain(this.udid);
  }

  /** @override */
  async resetContentAndSettings() {
    await this._simulatorLauncher.shutdown(this.udid);
    await this._applesimutils.resetContentAndSettings(this.udid);
    await this._simulatorLauncher.launch(this.udid, this._type, this._bootArgs);
  }

  /** @override */
  async takeScreenshot(screenshotName) {
    const tempPath = await temporaryPath.for.png();
    await this._applesimutils.takeScreenshot(this.udid, tempPath);

    await this.emitter.emit('createExternalArtifact', {
      pluginId: 'screenshot',
      artifactName: screenshotName || path.basename(tempPath, '.png'),
      artifactPath: tempPath,
    });

    return tempPath;
  }

  /** @override */
  async setStatusBar(flags) {
    await this._applesimutils.statusBarOverride(this.udid, flags);
  }

  /** @override */
  async resetStatusBar() {
    await this._applesimutils.statusBarReset(this.udid);
  }

  async _waitForBackground() {
    return await this.client.waitForBackground();
  }
}

/**
 * @typedef { LaunchInfo } LaunchInfoIosSim
 * @property languageAndLocale { String }
 */

class IosSimulatorAppDriver extends IosAppDriver {
  constructor(deps, { udid, bundleId }) {
    super(deps);
    this.udid = udid;
    this.bundleId = bundleId;

    this._applesimutils = deps.applesimutils;
  }

  /**
   * @override
   * @param launchInfo { LaunchInfoIosSim }
   */
  async launch(launchInfo) {
    const { udid, bundleId } = this;

    const launchArgsHandle = this._getLaunchArgsForPayloadsData(launchInfo.launchArgs);
    const { launchArgs } = launchArgsHandle;

    await this.emitter.emit('beforeLaunchApp', { bundleId, deviceId: udid, launchArgs });
    const pid = await this._applesimutils.launch(udid, bundleId, launchArgs, launchInfo.languageAndLocale);
    await this.emitter.emit('launchApp', { bundleId, deviceId: udid, launchArgs, pid });

    launchArgsHandle.cleanup();

    await this._waitUntilReady();
    await this._waitForActive();
    return pid;
  }

  /**
   * @override
   * @param launchInfo { LaunchInfoIosSim }
   */
  async waitForLaunch(launchInfo) {
    const { udid, bundleId } = this;

    // Note: This is purely semantic; Has no analytical value.
    const launchArgsHandle = this._getLaunchArgsForPayloadsData(launchInfo.launchArgs);
    const { launchArgs } = launchArgsHandle;

    await this.emitter.emit('beforeLaunchApp', { bundleId, deviceId: udid, launchArgs });

    this._applesimutils.printLaunchHint(udid, bundleId, launchArgs, launchInfo.languageAndLocale);
    await pressAnyKey();

    const pid = await this._applesimutils.getPid(udid, bundleId);
    if (Number.isNaN(pid)) {
      throw new DetoxRuntimeError({
        message: `Failed to find a process corresponding to the app bundle identifier (${bundleId}).`,
        hint: `Make sure that the app is running on the device (${udid}), visually or via CLI:\n` +
          `xcrun simctl spawn ${this.udid} launchctl list | grep -F '${bundleId}'\n`,
      });
    } else {
      log.info({}, `Found the app (${bundleId}) with process ID = ${pid}. Proceeding...`);
    }
    await this.emitter.emit('launchApp', { bundleId, deviceId: udid, launchArgs, pid });

    launchArgsHandle.cleanup();

    await this._waitUntilReady();
    await this._waitForActive();
    return pid;
  }

  /** @override */
  async setPermissions(permissions) {
    const { udid, bundleId } = this;
    await this._applesimutils.setPermissions(udid, bundleId, permissions);
  }

  /** @override */
  async sendToHome() {
    await this._applesimutils.sendToHome(this.udid);
    await this._waitForBackground();
  }

  /** @override */
  async matchFace() {
    await this._applesimutils.matchBiometric(this.udid, 'Face');
    await this._waitForActive();
  }

  /** @override */
  async unmatchFace() {
    await this._applesimutils.unmatchBiometric(this.udid, 'Face');
    await this._waitForActive();
  }

  /** @override */
  async matchFinger() {
    await this._applesimutils.matchBiometric(this.udid, 'Finger');
    await this._waitForActive();
  }

  /** @override */
  async unmatchFinger() {
    await this._applesimutils.unmatchBiometric(this.udid, 'Finger');
    await this._waitForActive();
  }

  /** @override */
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

  async _waitUntilReady() {
    return super._waitUntilReady(); // Just for clarity
  }

  async _waitForActive() {
    return this.client.waitForActive();
  }

  // TODO (multiapps) Reiterate this ugly func signature
  _getLaunchArgsForPayloadsData(launchArgs) {
    let paramName;
    if (launchArgs.detoxUserNotificationDataURL) {
      paramName = 'detoxUserNotificationDataURL';
    } else if (launchArgs.detoxUserActivityDataURL) {
      paramName = 'detoxUserActivityDataURL';
    } else {
      return { launchArgs, cleanup: _.noop };
    }

    const payloadFile = tempFile.create('payload.json');
    return {
      launchArgs: {
        ...launchArgs,
        [paramName]: payloadFile.path,
      },
      cleanup: () => payloadFile.cleanup(),
    };
  }
}


module.exports = {
  IosSimulatorDeviceDriver,
  IosSimulatorAppDriver,
};
