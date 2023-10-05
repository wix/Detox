const _ = require('lodash');

class DetoxInitErrorListener {
  add_hook(event, { unhandledErrors, currentDescribeBlock, rootDescribeBlock }) {
    if (_.isEmpty(unhandledErrors)) {
      return;
    }

    if (currentDescribeBlock !== rootDescribeBlock || currentDescribeBlock.hooks.length > 1) {
      _.last(currentDescribeBlock.hooks).fn = async () => {};
    }
  }

  add_test(event, { unhandledErrors, currentDescribeBlock }) {
    if (!_.isEmpty(unhandledErrors)) {
      const currentTest = _.last(currentDescribeBlock.children);
      const dummyError = new Error('Environment setup failed. See the detailed error below.');
      dummyError.stack = '';

      currentTest.errors.push(dummyError);
    }
  }
}

module.exports = DetoxInitErrorListener;
