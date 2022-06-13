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
  async deliverPayload(params) {
    return await this.client.deliverPayload(params);
  }

  /** @override */
  async sendUserActivity(payload) {
    await this._sendPayload('detoxUserActivityDataURL', payload);
  }

  /** @override */
  async sendUserNotification(payload) {
    await this._sendPayload('detoxUserNotificationDataURL', payload);
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

  async _sendPayload(name, payload) {
    const payloadFile = this._createPayloadFile(payload);

    await this.deliverPayload({
      [name]: payloadFile.path,
    });
    payloadFile.cleanup();
  }

  async _waitForActive() {
    return await this.client.waitForActive();
  }
}


module.exports = {
  IosDeviceDriver,
  IosAppDriver,
};
