const { DetoxCircusEnvironment } = require('detox/runners/jest');
const { worker } = require('detox/internals')

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  async setup() {
    await super.setup();

    this.global.__waitUntilArtifactsManagerIsIdle__ = () => {
      return worker._artifactsManager._idlePromise;
    };
  }

  async initDetox() {
    const worker = await super.initDetox();
    if (worker.device.deviceDriver.adb) {
      worker.device.deviceDriver.adb.installOptions = {
        timeout: 45_000,
      };
    }
    return worker;
  }
}

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

module.exports = CustomDetoxEnvironment;
