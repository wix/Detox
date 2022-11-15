const _ = require('lodash');

const { device } = require('../../../..');

const PLATFORM_REGEXP = /^:([^:]+):/;

class DetoxPlatformFilterListener {
  setup() {
    this._platform = device.getPlatform();
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
