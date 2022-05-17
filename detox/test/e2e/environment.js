const {
  DetoxCircusEnvironment,
  SpecReporter,
  WorkerAssignReporter,
} = require('detox/runners/jest');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(config, context) {
    super(config, context);

    this.registerListeners({
      SpecReporter,
      WorkerAssignReporter,
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
