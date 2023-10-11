const { sleepSomeTime, sleepALittle } = require('./stubSleeps');

class StubDeviceAllocationDriver {
  counter = 0;

  async allocate() {
    const deviceId = `StubDevice#${++this.counter}`;

    await sleepSomeTime();
    return { id: deviceId };
  }

  async free(cookie, { shutdown }) {
    await sleepALittle();

    if (shutdown) {
      await sleepSomeTime();
    }
  }
}

module.exports = StubDeviceAllocationDriver;
