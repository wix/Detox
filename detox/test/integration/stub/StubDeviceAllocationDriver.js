 const StubCookie = require('./StubCookie');
const { sleepSomeTime, sleepALittle } = require('./stubSleeps');

class StubDeviceAllocationDriver {
  constructor() {
  }

  async allocate() {
    const deviceId = `StubDevice#${process.env.JEST_WORKER_ID}`;

    await sleepSomeTime();
    return new StubCookie(deviceId);
  }

  async free(cookie, { shutdown }) {
    await sleepALittle();

    if (shutdown) {
      await sleepSomeTime();
    }
  }
}

module.exports = StubDeviceAllocationDriver;
