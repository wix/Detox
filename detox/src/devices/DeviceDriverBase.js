const _ = require('lodash');
const fs = require('fs');
const os = require('os');
const path = require('path');

class DeviceDriverBase {
  constructor(client) {
    this.client = client;
  }

  async acquireFreeDevice(name) {
    await Promise.resolve('');
  }

  async prepare() {
    return await Promise.resolve('');
  }

  async boot() {
    return await Promise.resolve('');
  }

  async launch() {
    return await Promise.resolve('');
  }

  async sendToHome() {
    return await Promise.resolve('');
  }

  async shake() {
    return await Promise.resolve('');
  }

  async relaunchApp() {
    return await Promise.resolve('');
  }

  async installApp() {
    return await Promise.resolve('');
  }

  async uninstallApp() {
    return await Promise.resolve('');
  }

  async deliverPayload(params) {
    return await this.client.deliverPayload(params);
  }

  async setLocation(lat, lon) {
    return await Promise.resolve('');
  }

  async waitUntilReady() {
    return await this.client.waitUntilReady();
  }

  async reloadReactNative() {
    return await this.client.reloadReactNative();
  }

  createPayloadFile(notification) {

  }

  async setPermissions(deviceId, bundleId, permissions) {
    return await Promise.resolve('');
  }

  async terminate(deviceId, bundleId) {
    return await Promise.resolve('');
  }

  async shutdown() {
    return await Promise.resolve('');
  }

  async setOrientation(deviceId, orientation) {
    return await Promise.resolve('');
  }

  async setURLBlacklist(urlList) {
    return await Promise.resolve('');
  }

  async enableSynchronization() {
    return await Promise.resolve('');
  }

  async disableSynchronization() {
    return await Promise.resolve('');
  }

  async resetContentAndSettings() {
    return await Promise.resolve('');
  }

  defaultLaunchArgsPrefix() {
    return '';
  }
  
  createRandomDirectory() {
    const randomDir = fs.mkdtempSync(path.join(os.tmpdir(), 'detoxrand-'));
    this.ensureDirectoryExistence(randomDir);
    return randomDir;
  }
  
  cleanupRandomDirectory(fileOrDir) {
    if(path.basename(fileOrDir).startsWith('detoxrand-')) {
      this._whyIsThereNoRMRFInNode(fileOrDir);
      return
    }
    
    this.cleanupRandomDirectory(path.dirname(fileOrDir));
  }
  
  _whyIsThereNoRMRFInNode(path) {
    if(fs.existsSync(path)) {
      fs.readdirSync(path).forEach(function(file, index){
        var curPath = path + "/" + file;
        if (fs.lstatSync(curPath).isDirectory()) {
          _whyIsThereNoRMRFInNode(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    }
  }

  ensureDirectoryExistence(dirPath) {
    if (fs.existsSync(dirPath)) {
      return;
    }
	
    const dirOfDir = path.dirname(dirPath);

    this.ensureDirectoryExistence(dirOfDir);
    fs.mkdirSync(dirOfDir);
    return;
  }

  getBundleIdFromBinary(appPath) {

  }

  validateDeviceConfig(deviceConfig) {

  }

  getPlatform() {

  }

  async cleanup(deviceId, bundleId) {
    return await Promise.resolve('');
  }

  getLogsPaths(deviceId) {
    return {
      stdout: undefined,
      stderr: undefined
    };
  }
}

module.exports = DeviceDriverBase;
