const DetoxRuntimeError = require('../../../../errors/DetoxRuntimeError');
const { DeviceDriver, TestAppDriver } = require('../BaseDrivers');

class IosDeviceDriver extends DeviceDriver {
  /** @override */
  get platform() {
    return 'ios';
  }
}

class IosAppDriver extends TestAppDriver {
  /** @override */
  async deselect() {
    // We do not yet support concurrently running apps on iOS, so - keeping the legacy behavior,
    // we must terminate if we're not the selected ones.
    if (this.isRunning()) {
      await this.terminate();
    }
  }

  /** @override */
  async openURL(params) {
    return this._deliverPayload(params);
  }

  /** @override */
  async terminate() {
    // TODO effectively terminate
    await super.terminate();
  }

  /** @override */
  async setOrientation(orientation) {
    if (!['portrait', 'landscape'].some(option => option === orientation)) {
      const message = `orientation should be either 'portrait' or 'landscape', but got (${orientation})`;
      throw new DetoxRuntimeError({ message });
    }
    await this.client.setOrientation({ orientation });
  }

  /** @override */
  async shake() {
    await this.client.shake();
    await this._waitForActive();
  }

  async _deliverPayload(payload) {
    return this.client.deliverPayload(payload);
  }

  async _waitForActive() {
    return await this.client.waitForActive();
  }
}


module.exports = {
  IosDeviceDriver,
  IosAppDriver,
};
