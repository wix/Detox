const _ = require('lodash');
const { DetoxCircusEnvironment } = require('@detox/runner-jest');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  async setup() {
    await super.setup();
    this._addedTest = false;
  }

  handleTestEvent(event, state) {
    return super.handleTestEvent(event, state);
  }
}

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

module.exports = CustomDetoxEnvironment;
