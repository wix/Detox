const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const argparse = require('../utils/argparse');
const configuration = require('../configuration');
const ArtifactsCopier = require('../artifacts/ArtifactsCopier');

class Device {

  constructor(deviceConfig, sessionConfig, deviceDriver) {
    this._deviceConfig = deviceConfig;
    this._sessionConfig = sessionConfig;
    this.deviceDriver = deviceDriver;
    this._processes = {};
    this._artifactsCopier = new ArtifactsCopier(deviceDriver);
    this.deviceDriver.validateDeviceConfig(deviceConfig);
  }

  async prepare(params = {}) {
    this._binaryPath = this._getAbsolutePath(this._deviceConfig.binaryPath);
    this._deviceId = await this.deviceDriver.acquireFreeDevice(this._deviceConfig.name);
    this._bundleId = await this.deviceDriver.getBundleIdFromBinary(this._binaryPath);
    this._artifactsCopier.prepare(this._deviceId);

    await this.deviceDriver.boot(this._deviceId);

    if (!argparse.getArgValue('reuse')) {
      await this.deviceDriver.uninstallApp(this._deviceId, this._bundleId);
      await this.deviceDriver.installApp(this._deviceId, this._binaryPath);
    }

    if (params.launchApp) {
      await this.launchApp({newInstance: true});
    }
  }

  setArtifactsDestination(testArtifactsPath) {
    this._artifactsCopier.setArtifactsDestination(testArtifactsPath);
  }

  async finalizeArtifacts() {
    await this._artifactsCopier.finalizeArtifacts();
  }

  async launchApp(params = {newInstance: false}, bundleId) {
    await this._artifactsCopier.handleAppRelaunch();

    if (params.url && params.userNotification) {
      throw new Error(`detox can't understand this 'relaunchApp(${JSON.stringify(params)})' request, either request to launch with url or with userNotification, not both`);
    }

    if (params.delete) {
      await this.deviceDriver.uninstallApp(this._deviceId, this._bundleId);
      await this.deviceDriver.installApp(this._deviceId, this._binaryPath);
    } else if (params.newInstance) {
      await this.deviceDriver.terminate(this._deviceId, this._bundleId);
    }

    let baseLaunchArgs = {};
    if (params.launchArgs) {
      baseLaunchArgs = params.launchArgs;
    }

    if (params.url) {
      baseLaunchArgs['detoxURLOverride'] = params.url;
      if(params.sourceApp) {
        baseLaunchArgs['detoxSourceAppOverride'] = params.sourceApp;
      }
    } else if (params.userNotification) {
      baseLaunchArgs = {'detoxUserNotificationDataURL': this.deviceDriver.createPushNotificationJson(params.userNotification)};
    }

    if (params.permissions) {
      await this.deviceDriver.setPermissions(this._deviceId, this._bundleId, params.permissions);
    }

    this._addPrefixToDefaultLaunchArgs(baseLaunchArgs);

    const _bundleId = bundleId || this._bundleId;
    const processId = await this.deviceDriver.launch(this._deviceId, _bundleId, this._prepareLaunchArgs(baseLaunchArgs));

    if (this._processes[_bundleId] === processId) {
      if (params.url) {
        await this.openURL(params);
      } else if (params.userNotification) {
        await this.sendUserNotification(params.userNotification);
      }
    }

    this._processes[_bundleId] = processId;

    await this.deviceDriver.waitUntilReady();
  }

  /**deprecated */
  async relaunchApp(params = {}, bundleId) {
    if (params.newInstance === undefined) {
      params['newInstance'] = true;
    }
    await this.launchApp(params, bundleId);
  }

  async sendToHome() {
    await this.deviceDriver.sendToHome(this._deviceId);
  }

  async terminateApp(bundleId) {
    const _bundleId = bundleId || this._bundleId;
    await this.deviceDriver.terminate(this._deviceId, _bundleId);
  }

  async installApp(binaryPath) {
    const _binaryPath = binaryPath || this._binaryPath;
    await this.deviceDriver.installApp(this._deviceId, _binaryPath);
  }

  async uninstallApp(bundleId) {
    const _bundleId = bundleId || this._bundleId;
    await this.deviceDriver.uninstallApp(this._deviceId, _bundleId);
  }

  async reloadReactNative() {
    await this.deviceDriver.reloadReactNative();
  }

  async openURL(params) {
    if (typeof params !== 'object' || !params.url) {
      throw new Error(`openURL must be called with JSON params, and a value for 'url' key must be provided. example: await device.openURL({url: "url", sourceApp[optional]: "sourceAppBundleID"}`);
    }

    await this.deviceDriver.openURL(this._deviceId, params);
  }

  async shutdown() {
    await this.deviceDriver.shutdown(this._deviceId);
  }

  async setOrientation(orientation) {
    await this.deviceDriver.setOrientation(this._deviceId, orientation);
  }

  async setLocation(lat, lon) {
    lat = (lat + '').replace('.', ',');
    lon = (lon + '').replace('.', ',');
    await this.deviceDriver.setLocation(this._deviceId, lat, lon);
  }

  async sendUserNotification(params) {
    await this.deviceDriver.sendUserNotification(params);
  }

  async setURLBlacklist(urlList) {
    await this.deviceDriver.setURLBlacklist(urlList);
  }

  async enableSynchronization() {
    await this.deviceDriver.enableSynchronization();
  }

  async disableSynchronization() {
    await this.deviceDriver.disableSynchronization();
  }

  getPlatform() {
    return this.deviceDriver.getPlatform(this._deviceId);
  }

  _defaultLaunchArgs() {
    return {
      'detoxServer': this._sessionConfig.server,
      'detoxSessionId': this._sessionConfig.sessionId
    };
  }

  _addPrefixToDefaultLaunchArgs(args) {
    let newArgs = {};
    _.forEach(args, (value, key) => {
      newArgs[`${this.deviceDriver.defaultLaunchArgsPrefix()}${key}`] = value;
    });
    return newArgs;
  }

  _prepareLaunchArgs(additionalLaunchArgs) {
    let args = [];
    const merged = _.merge(this._defaultLaunchArgs(), additionalLaunchArgs);
    const launchArgs = this._addPrefixToDefaultLaunchArgs(merged);
    //args = args.concat(_.flatten(Object.entries(launchArgs)));
    return launchArgs;
  }

  _getAbsolutePath(appPath) {
    if (!appPath) {
      return '';
    }
    const absPath = path.join(process.cwd(), appPath);
    if (fs.existsSync(absPath)) {
      return absPath;
    } else {
      throw new Error(`app binary not found at '${absPath}', did you build it?`);
    }
  }
}

module.exports = Device;
