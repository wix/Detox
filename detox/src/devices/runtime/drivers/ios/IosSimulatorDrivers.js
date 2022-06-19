// @ts-nocheck
const path = require('path');

const _ = require('lodash');

const temporaryPath = require('../../../../artifacts/utils/temporaryPath');
const DetoxRuntimeError = require('../../../../errors/DetoxRuntimeError');
const getAbsoluteBinaryPath = require('../../../../utils/getAbsoluteBinaryPath');
const log = require('../../../../utils/logger').child({ __filename });
const pressAnyKey = require('../../../../utils/pressAnyKey');

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
}

/**
 * @typedef { LaunchInfo } LaunchInfoIosSim
 * @property [languageAndLocale] { String }
 */

/**
 * @typedef { TestAppDriverDeps } IosSimulatorAppDriverDeps
 * @property applesimutils { AppleSimUtils }
 */

class IosSimulatorAppDriver extends IosAppDriver {

  /**
   * @param deps { IosSimulatorAppDriverDeps }
   * @param props {{ udid: String }}
   */
  constructor(deps, { udid }) {
    super(deps);
    this.udid = udid;

    this._applesimutils = deps.applesimutils;
  }

  /**
   * @override
   * @param launchInfo { LaunchInfoIosSim }
   */
  async launch(launchInfo) {
    this._pid = await this._handleLaunchApp({ manually: false, launchInfo });
  }

  /**
   * @override
   * @param launchInfo { LaunchInfoIosSim }
   */
  async waitForLaunch(launchInfo) {
    this._pid = await this._handleLaunchApp({ manually: true, launchInfo });
  }

  /** @override */
  async terminate() {
    const { udid, bundleId } = this;
    await this.emitter.emit('beforeTerminateApp', { deviceId: udid, bundleId });
    await this._applesimutils.terminate(udid, bundleId);
    await this.emitter.emit('terminateApp', { deviceId: udid, bundleId });

    await super.terminate();
  }

  /** @override */
  async invoke(action) {
    return this.invocationManager.execute(action);
  }

  /** @override */
  async install() {
    await this._applesimutils.install(this.udid, getAbsoluteBinaryPath(this._appInfo.binaryPath));
  }

  /** @override */
  async uninstall() {
    const { udid, bundleId } = this;
    await this.emitter.emit('beforeUninstallApp', { deviceId: udid, bundleId });
    await this._applesimutils.uninstall(udid, bundleId);
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

  async _waitForBackground() {
    return await this.client.waitForBackground();
  }

  async _predeliverPayloadIfNeeded(launchArgs) {
    if (this.isRunning()) {
      const payloadKeys = ['detoxURLOverride', 'detoxUserNotificationDataURL', 'detoxUserActivityDataURL'];
      const payload = assertAndPickSingleKey(payloadKeys, launchArgs);
      if (payload) {
        await this._deliverPayload(payload);
      }
    }
  }

  async _handleLaunchApp({ manually, launchInfo }) {
    const { udid, bundleId } = this;

    // TODO In launch-mode: Is this "predelivery" indeed required when we're just 2ms away from sending the payload via the
    //  'payload.json' file? :facepalm:
    // TODO In manual-mode: Is this "predelivery" even required altogether?
    await this._predeliverPayloadIfNeeded(launchInfo.launchArgs);

    const launchArgsHandle = this._getLaunchArgsForPayloadsData(launchInfo.launchArgs);
    let { launchArgs } = launchArgsHandle;

    launchArgs = await this._applyAppSessionArgs(launchArgs);

    await this.emitter.emit('beforeLaunchApp', { bundleId, deviceId: udid, launchArgs });

    let pid;
    if (manually) {
      pid = await this.__waitForAppLaunch(launchArgs, launchInfo.languageAndLocale);
    } else {
      pid = await this.__launchApp(launchArgs, launchInfo.languageAndLocale);
    }

    await this.emitter.emit('launchApp', { bundleId, deviceId: udid, launchArgs, pid });

    launchArgsHandle.cleanup();

    await this._waitUntilReady();
    await this._waitForActive();
    await this._notifyAppReady(udid, bundleId);

    return pid;
  }

  async __waitForAppLaunch(launchArgs, languageAndLocale) {
    const { udid, bundleId } = this;

    this._applesimutils.printLaunchHint(udid, bundleId, launchArgs, languageAndLocale);
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
    return pid;
  }

  async __launchApp(launchArgs, languageAndLocale) {
    const { udid, bundleId } = this;

    await this.emitter.emit('beforeLaunchApp', { bundleId, deviceId: udid, launchArgs });
    const pid = await this._applesimutils.launch(udid, bundleId, launchArgs, languageAndLocale);
    await this.emitter.emit('launchApp', { bundleId, deviceId: udid, launchArgs, pid });
    return pid;
  }

  _applyAppSessionArgs(launchArgs) {
    return {
      detoxServer: this.client.serverUrl,
      detoxSessionId: this.client.sessionId,
      ...launchArgs,
    };
  }

  // TODO (multiapps) Revisit this ugly func signature
  _getLaunchArgsForPayloadsData(launchArgs) {
    let paramName;
    if (launchArgs.detoxUserNotificationDataURL) {
      paramName = 'detoxUserNotificationDataURL';
    } else if (launchArgs.detoxUserActivityDataURL) {
      paramName = 'detoxUserActivityDataURL';
    } else {
      return { launchArgs, cleanup: _.noop };
    }

    const payloadFile = this._createPayloadFile(launchArgs[paramName]);
    return {
      launchArgs: {
        ...launchArgs,
        [paramName]: payloadFile.path,
      },
      cleanup: () => payloadFile.cleanup(),
    };
  }
}

function assertAndPickSingleKey(keys, pojo) {
  const projection = _.pick(pojo, keys);
  const projKeys = Object.keys(projection);

  if (projKeys.length > 1) {
    const message = `An app cannot be launched with more than one url/data arguments; See https://wix.github.io/Detox/docs/api/device-object-api/#devicelaunchappparams`;
    throw new DetoxRuntimeError({ message });
  }

  if (projKeys.length === 0) {
    return null;
  }

  return projection;
}

module.exports = {
  IosSimulatorDeviceDriver,
  IosSimulatorAppDriver,
};
