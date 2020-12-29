const WorkerAssignReporterCircus = require('detox/runners/jest/WorkerAssignReporterCircus');
const SpecReporterCircus = require('detox/runners/jest/SpecReporterCircus');
const DetoxCircusEnvironment = require('detox/runners/jest-circus/environment');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(config, context) {
    super(config, context);

    this.registerListeners({
      SpecReporterCircus,
      WorkerAssignReporterCircus,
    });
  }

  async initDetox() {
    const instance = await super.initDetox();

    this.global.detox.__waitUntilArtifactsManagerIsIdle__ = () => {
      return instance._artifactsManager._idlePromise;
    };

    return instance;
  }
}

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

module.exports = CustomDetoxEnvironment;
