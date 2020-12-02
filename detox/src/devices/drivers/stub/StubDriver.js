const DeviceDriverBase = require('../DeviceDriverBase');
const TimelineArtifactPlugin = require('../../../artifacts/timeline/TimelineArtifactPlugin');
const tempfile = require('tempfile');
const temporaryPath = require('../../../artifacts/utils/temporaryPath');
const sleep = require('../../../utils/sleep');
const { Trace } = require('../../../utils/trace');

const sleepVeryLittle = () => sleep(10);
const sleepALittle = () => sleep(100);
const sleepSomeTime = () => sleep(1000);
const sleepALot = () => sleep(2000);

class TimestampStub {
  constructor() {
    this._now = 1000;
  }

  now() {
    const now = this._now;
    this._now += 100;
    return now;
  }
}

class StubDriver extends DeviceDriverBase {
  static getTraceTimestampFn() {
    const timestampStub = new TimestampStub();
    return () => timestampStub.now();
  }

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
    const timestampStub = new TimestampStub();
    const trace = new Trace(() => timestampStub.now());
    return {
      timeline: (api) => new TimelineArtifactPlugin({ api, trace }),
    };
  }

  async acquireFreeDevice(deviceQuery) {
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
