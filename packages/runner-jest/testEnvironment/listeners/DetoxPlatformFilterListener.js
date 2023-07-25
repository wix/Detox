const _ = require('lodash');

const PLATFORM_REGEXP = /^:([^:]+):/;

class DetoxPlatformFilterListener {
  constructor({ env }) {
    this._env = env;
  }

  setup() {
    this._platform = this._env.detox.device.getPlatform();
  }

  start_describe_definition(event, state) {
    const match = event.blockName.match(PLATFORM_REGEXP);
    if (match && match[1] !== this._platform) {
      state.currentDescribeBlock.mode = 'skip';
    }
  }

  add_test(event, state) {
    const match = event.testName.match(PLATFORM_REGEXP);
    if (match && match[1] !== this._platform) {
      _.last(state.currentDescribeBlock.children).mode = 'skip';
    }
  }
}

module.exports = DetoxPlatformFilterListener;
