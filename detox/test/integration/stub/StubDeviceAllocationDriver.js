 const StubCookie = require('./StubCookie');
const { sleepSomeTime, sleepALittle } = require('./stubSleeps');

class StubDeviceAllocationDriver {
  constructor({ eventEmitter }) {
    this._emitter = eventEmitter;
  }

  async allocate(deviceQuery) {
    const deviceId = `StubDevice#${process.env.JEST_WORKER_ID}`;

    await sleepSomeTime();
    await this._emitter.emit('bootDevice', { coldBoot: false, deviceId, type: 'stub' });
    return new StubCookie(deviceId);
  }
}

class StubDeviceDeallocationDriver {
  async free({ shutdown }) {
    await sleepALittle();

    if (shutdown) {
      await sleepSomeTime();
    }
  }
}

module.exports = {
  StubDeviceAllocationDriver,
  StubDeviceDeallocationDriver,
};
