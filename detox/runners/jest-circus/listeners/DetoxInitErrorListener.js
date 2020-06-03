const _ = require('lodash');

class DetoxInitErrorListener {
  setup(event, { unhandledErrors, rootDescribeBlock }) {
    if (unhandledErrors.length > 0) {
      rootDescribeBlock.mode = 'skip';
    }
  }

  add_test(event, { currentDescribeBlock, rootDescribeBlock }) {
    if (currentDescribeBlock === rootDescribeBlock && rootDescribeBlock.mode === 'skip') {
      const currentTest = _.last(currentDescribeBlock.children);

      if (currentTest) {
        currentTest.mode = 'skip';
      }
    }
  }
}

module.exports = DetoxInitErrorListener;
