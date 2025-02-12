const { isRNNewArch, rnVersion } = require('../../../src/utils/rn-consts/rn-consts');

/** @type {import('jest-environment-emit').EnvironmentListenerFn} */
const listener = ({ testEvents }) => {
  const shouldSkip = (name) => {
    if (isRNNewArch && name.includes('@legacy')) {
      return true;
    }

    if (!isRNNewArch && name.includes('@new-arch')) {
      return true;
    }

    const match = name.match(/@rn(\d+)/i);
    return match && match[1] !== rnVersion.minor;
  };

  testEvents
  .on('start_describe_definition', ({ event: { blockName }, state: { currentDescribeBlock }}) => {
    if (shouldSkip(blockName)) {
      currentDescribeBlock.mode = 'skip';
    }
  })
  .on('add_test', ({ event: { testName }, state: { currentDescribeBlock }}) => {
    if (shouldSkip(testName)) {
      const lastTestIndex = currentDescribeBlock.children.length - 1;
      currentDescribeBlock.children[lastTestIndex].mode = 'skip';
    }
  });
};

module.exports = listener;
