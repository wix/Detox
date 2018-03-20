const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const argparse = require('../utils/argparse');
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

    await this.deviceDriver.prepare();

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
  
  createPayloadFileAndUpdatesParamsObject(key, launchKey, params, baseLaunchArgs) {
    const payloadFilePath = this.deviceDriver.createPayloadFile(params[key]);
    baseLaunchArgs[launchKey] = payloadFilePath;
    //`params` will be used later for `deliverPayload`, so remove the actual notification and add the file URL
    delete params[key];
    params[launchKey] = payloadFilePath;
  }
  
  cleanupPayloadFile(launchKey, params) {
    this.deviceDriver.cleanupRandomDirectory(params[launchKey]);
  }

  async launchApp(params = {newInstance: false}, bundleId) {
    await this._artifactsCopier.handleAppRelaunch();
	
    let paramsCounter = 0;
	
    const singleParams = ['url', 'userNotification', 'userActivity'];
    singleParams.forEach((item) => {
      if(params[item]) {
        paramsCounter += 1;
      }
    })

    if (paramsCounter > 1) {
      throw new Error(`Call to 'launchApp(${JSON.stringify(params)})' must contain only one of ${JSON.stringify(singleParams)}.`);
    }
    
    params.deliverPayload = paramsCounter == 1;

    if (params.delete) {
      await this.deviceDriver.terminate(this._deviceId, this._bundleId);
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
      if (params.sourceApp) {
        baseLaunchArgs['detoxSourceAppOverride'] = params.sourceApp;
      }
    } else if (params.userNotification) {
      this.createPayloadFileAndUpdatesParamsObject('userNotification', 'detoxUserNotificationDataURL', params, baseLaunchArgs);
    } else if (params.userActivity) {
      this.createPayloadFileAndUpdatesParamsObject('userActivity', 'detoxUserActivityDataURL', params, baseLaunchArgs);
    }

    if (params.permissions) {
      await this.deviceDriver.setPermissions(this._deviceId, this._bundleId, params.permissions);
    }

    const _bundleId = bundleId || this._bundleId;
    if (this._isAppInBackground(params, _bundleId)) {
      if (params.deliverPayload) {
        await this.deviceDriver.deliverPayload({...params, delayPayload: true});        
      }
    }

    const processId = await this.deviceDriver.launch(this._deviceId, _bundleId, this._prepareLaunchArgs(baseLaunchArgs));
    this._processes[_bundleId] = processId;

    await this.deviceDriver.waitUntilReady();
    
    if(params.detoxUserNotificationDataURL) {
      this.cleanupPayloadFile('detoxUserNotificationDataURL', params);
    }
    if(params.detoxUserActivityDataURL) {
      this.cleanupPayloadFile('detoxUserActivityDataURL', params);
    }
  }

  _isAppInBackground(params, _bundleId) {
    return !params.delete && !params.newInstance && this._processes[_bundleId];
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

  async shake() {
    await this.deviceDriver.shake(this._deviceId);
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

    await this.deviceDriver.deliverPayload(params);
  }

  async shutdown() {
    await this.deviceDriver.shutdown(this._deviceId);
  }

  async setOrientation(orientation) {
    await this.deviceDriver.setOrientation(this._deviceId, orientation);
  }

  async setLocation(lat, lon) {
    lat = String(lat);
    lon = String(lon);
    await this.deviceDriver.setLocation(this._deviceId, lat, lon);
  }

  //Do not remove this, it is very important for our customers!
  async __debug_sleep(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
  }

  async _sendPayload(key, params) {
    const payloadFilePath = this.deviceDriver.createPayloadFile(params);
    let payload = {};
    //JS does not support {key: "asd"} JSON generation where the `key` is a variable 🤦‍♂️
    payload[key] = payloadFilePath;
    await this.deviceDriver.deliverPayload(payload);
    this.deviceDriver.cleanupRandomDirectory(payloadFilePath);
  }

  async sendUserActivity(params) {
    await this._sendPayload('detoxUserActivityDataURL', params);
  }

  async sendUserNotification(params) {
    await this._sendPayload('detoxUserNotificationDataURL', params);
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

  async resetContentAndSettings() {
    await this.deviceDriver.resetContentAndSettings(this._deviceId);
  }

  getPlatform() {
    return this.deviceDriver.getPlatform(this._deviceId);
  }

  async _cleanup() {
    await this.deviceDriver.cleanup(this._deviceId, this._bundleId);
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
    const merged = _.merge(this._defaultLaunchArgs(), additionalLaunchArgs);
    const launchArgs = this._addPrefixToDefaultLaunchArgs(merged);
    return launchArgs;
  }

  _getAbsolutePath(appPath) {
    if (path.isAbsolute(appPath)) {
      return appPath;
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
