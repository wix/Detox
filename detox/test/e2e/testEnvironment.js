const { DetoxCircusEnvironment } = require('detox/runners/jest');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  async setup() {
    await super.setup();

    // The artifacts manager is not part of the v21 alpha; nothing to wait for.
    this.global.__waitUntilArtifactsManagerIsIdle__ = () => Promise.resolve();
  }
}

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

module.exports = CustomDetoxEnvironment;
