const DeviceDriverBase = require('detox/src/devices/runtime/drivers/DeviceDriverBase')
const tempfile = require('tempfile');
const temporaryPath = require('detox/src/artifacts/utils/temporaryPath');
const {
  sleepSomeTime,
  sleepVeryLittle,
  sleepALittle,
  sleepALot,
} = require('./stubSleeps');

class StubRuntimeDriver extends DeviceDriverBase {
  /**
   * @param deviceCookie { StubCookie }
   * @param deps { Object }
   */
  constructor(deviceCookie, deps) {
    super(deps);
    this._deviceId = deviceCookie.id;
  }

  getExternalId() {
    return this._deviceId;
  }

  getDeviceName() {
    return `Stub #${this._deviceId}`;
  }

  getPlatform() {
    return 'stub';
  }

  async installApp(binaryPath, testBinaryPath) {
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

  async takeScreenshot(screenshotName) {
    await sleepALittle();
    return temporaryPath.for.png();
  }

  async sendToHome() {
    await sleepVeryLittle();
  }

  async pressBack() {
    await sleepSomeTime();
  }

  async terminate(bundleId) {
    await sleepSomeTime();
  }

  // TODO ASDASD Most likely, this won't be necessary across the board, and should be deleted here as well
  async shutdown() {
    await sleepSomeTime();
  }

  async resetContentAndSettings() {
    await sleepALittle();
  }
}

module.exports = StubRuntimeDriver;
