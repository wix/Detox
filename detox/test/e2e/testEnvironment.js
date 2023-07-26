const _ = require('lodash');
const { DetoxCircusEnvironment } = require('@detox/runner-jest');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  async setup() {
    await super.setup();
    this._addedTest = false;
  }

  handleTestEvent(event, state) {
    if (event.name === 'add_test') {
      if (this._addedTest) {
        // skip tests after the first one
        _.last(state.currentDescribeBlock.children).mode = 'skip';
      } else {
        this._addedTest = true;
      }
    }

    return super.handleTestEvent(event, state);
  }
}

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

module.exports = CustomDetoxEnvironment;
