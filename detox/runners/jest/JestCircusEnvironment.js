const NodeEnvironment = require('jest-environment-node'); // eslint-disable-line node/no-extraneous-require
const CircusTestEventListeners = require('./CircusTestEventListeners');

/**
 * @see https://www.npmjs.com/package/jest-circus#overview
 */
class JestCircusEnvironment extends NodeEnvironment {
  constructor(config) {
    super(config);
    this.testEventListeners = new CircusTestEventListeners();

    // Enable access to this instance (single in each worker's scope) by exposing a get-function.
    // Note: whatever's set into this.global will be exported in that way. The reason behind it is that
    // each suite is run inside a sandboxed JS context which scope is in fact this specific instance. See
    // NodeEnvironment's constructor for more info, or https://jestjs.io/docs/en/configuration#testenvironment-string
    // for additional ref.
    this.global.detoxCircus = {
      getEnv: () => this,
    };
  }

  addEventsListener(listener) {
    this.testEventListeners.addListener(listener);
  }

  async handleTestEvent(event, state) {
    await this.testEventListeners.notifyAll(event, state);
  }
}

module.exports = JestCircusEnvironment;
