const DeviceDriverBase = require('detox/src/devices/drivers/DeviceDriverBase');
const TimelineArtifactPlugin = require('detox/src/artifacts/timeline/TimelineArtifactPlugin');
const tempfile = require('tempfile');
const temporaryPath = require('detox/src/artifacts/utils/temporaryPath');
const sleep = require('detox/src/utils/sleep');

const sleepVeryLittle = () => sleep(10);
const sleepALittle = () => sleep(100);
const sleepSomeTime = () => sleep(1000);
const sleepALot = () => sleep(2000);

class StubDriver extends DeviceDriverBase {
  constructor(config) {
    super(config);

    this._deviceId = `StubDevice#${process.env.JEST_WORKER_ID}`;
    this._name = `Stub #${this._deviceId}`;
  }

  get name() {
    return this._name;
  }

  getPlatform() {
    return 'stub';
  }

  declareArtifactPlugins() {
    return {
      timeline: (api) => new TimelineArtifactPlugin({ api, useFakeTimestamps: true, }),
    };
  }

  async acquireFreeDevice(_deviceQuery, _deviceConfig) {
    await sleepSomeTime();
    await this.emitter.emit('bootDevice', { coldBoot: false, deviceId: this._deviceId, type: 'stub' });
    return this._deviceId;
  }

  async installApp(deviceId, binaryPath, testBinaryPath) {
    await sleepALot();
  }

  async uninstallApp() {
    await sleepALot();
  }

  async installUtilBinaries() {
    await sleepALot();
  }

  async launchApp() {
    return process.pid;
  }

  async deliverPayload(params) {
    await sleepVeryLittle();
  }

  async waitUntilReady() {
    await sleepSomeTime();
  }

  async reloadReactNative() {
    await sleepALittle();
  }

  createPayloadFile(notification) {
    return tempfile('fake_payload');
  }

  async waitForActive() {
    await sleepALittle();
  }

  async waitForBackground() {
    await sleepALittle();
  }

  async takeScreenshot(deviceId, screenshotName) {
    await sleepALittle();
    return temporaryPath.for.png();
  }

  async sendToHome() {
    await sleepVeryLittle();
  }

  async pressBack() {
    await sleepSomeTime();
  }

  async terminate(deviceId, bundleId) {
    await sleepSomeTime();
  }

  async shutdown() {
    await sleepSomeTime();
  }

  async resetContentAndSettings() {
    await sleepALittle();
  }
}

module.exports = StubDriver;
