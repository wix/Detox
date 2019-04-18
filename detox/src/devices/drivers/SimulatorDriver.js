const exec = require('child-process-promise').exec;
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const IosDriver = require('./IosDriver');
const configuration = require('../../configuration');
const environment = require('../../utils/environment');
const DeviceRegistry = require('../DeviceRegistry');

class SimulatorDriver extends IosDriver {

  constructor(config) {
    super(config);

    this.deviceRegistry = new DeviceRegistry({
      getDeviceIdsByType: async type => await this.applesimutils.findDevicesUDID(type),
      createDevice: type => this.applesimutils.create(type),
    });
  }

  async prepare() {
    const detoxFrameworkPath = await environment.getFrameworkPath();

    if (!fs.existsSync(detoxFrameworkPath)) {
      throw new Error(`${detoxFrameworkPath} could not be found, this means either you changed a version of Xcode or Detox postinstall script was unsuccessful.
      To attempt a fix try running 'detox clean-framework-cache && detox build-framework-cache'`);
    }
  }

  async cleanup(deviceId, bundleId) {
    await this.deviceRegistry.freeDevice(deviceId);
    await super.cleanup(deviceId, bundleId);
  }

  async acquireFreeDevice(name) {
    const deviceId = await this.deviceRegistry.getDevice(name);
    if (deviceId) {
      await this.boot(deviceId);
    } else {
      console.error('Unable to acquire free device ', name);
    }
    return deviceId;
  }

  async getBundleIdFromBinary(appPath) {
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

  async boot(deviceId) {
    const coldBoot = await this.applesimutils.boot(deviceId);
    await this.emitter.emit('bootDevice', { coldBoot, deviceId });
  }

  async installApp(deviceId, binaryPath) {
    await this.applesimutils.install(deviceId, binaryPath);
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

  async resetContentAndSettings(deviceId) {
    await this.shutdown(deviceId);
    await this.applesimutils.resetContentAndSettings(deviceId);
    await this.boot(deviceId);
  }

  validateDeviceConfig(deviceConfig) {
    if (!deviceConfig.binaryPath) {
      configuration.throwOnEmptyBinaryPath();
    }

    if (!deviceConfig.name) {
      configuration.throwOnEmptyName();
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
}

module.exports = SimulatorDriver;
