const DetoxEnvironment = require('detox/runners/jest/environment');

class CustomDetoxEnvironment extends DetoxEnvironment {
  async setup() {
    await super.setup();

    this.global.jest.setTimeout(120000);
    this.global.process.on('unhandledRejection', (reason, p) => {
      console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    });
  }
}

module.exports = DetoxEnvironment;
