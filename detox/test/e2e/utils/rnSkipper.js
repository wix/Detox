const rn = require('../../../src/utils/rn-consts/rn-consts').rnVersion.minor;

/** @type {import('jest-environment-emit').EnvironmentListenerFn} */
const listener = ({ testEvents }) => {
  testEvents
    .on('start_describe_definition', ({ event: { blockName }, state: { currentDescribeBlock }}) => {
      const match = blockName.match(/@rn(\d+)/i);
      if (match && match[1] != rn) {
        currentDescribeBlock.mode = 'skip';
      }
    })
    .on('add_test', ({ event: { testName }, state: { currentDescribeBlock }}) => {
      const match = testName.match(/@rn(\d+)/i);
      if (match && match[1] != rn) {
        const n = currentDescribeBlock.children.length;
        currentDescribeBlock.children[n - 1].mode = 'skip';
      }
    });
};

module.exports = listener;
