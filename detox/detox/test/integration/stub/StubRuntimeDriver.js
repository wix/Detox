const temporaryPath = require('detox/src/artifacts/utils/temporaryPath');
const DeviceDriverBase = require('detox/src/devices/runtime/drivers/DeviceDriverBase');
const tempfile = require('tempfile');

const {
  sleepSomeTime,
  sleepVeryLittle,
  sleepALittle,
  sleepALot,
} = require('./stubSleeps');

class StubRuntimeDriver extends DeviceDriverBase {
  /**
   * @param deps { Object }
   * @param deviceCookie { StubCookie }
   */
  constructor(deps, deviceCookie) {
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

  async installApp() {
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

  createPayloadFile() {
    return tempfile('fake_payload');
  }

  async waitForActive() {
    await sleepALittle();
  }

  async waitForBackground() {
    await sleepALittle();
  }

  async takeScreenshot() {
    await sleepALittle();
    return temporaryPath.for.png();
  }

  async sendToHome() {
    await sleepVeryLittle();
  }

  async pressBack() {
    await sleepSomeTime();
  }

  async terminate() {
    await sleepSomeTime();
  }

  async resetContentAndSettings() {
    await sleepALittle();
  }
}

module.exports = StubRuntimeDriver;
