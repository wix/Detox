class InternalDeviceAPI {
  constructor({
    deviceDriver,
    getDeviceId,
  }) {
    this._deviceDriver = deviceDriver;
    this._getDeviceId = getDeviceId;
  }

  async typeText(text) {
    await this._deviceDriver.typeText(this._getDeviceId(), text);
  }
}

module.exports = InternalDeviceAPI;
