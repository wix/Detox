const { build } = require('./utils/frameworkUtils');

module.exports = {
  command: 'build-framework-cache',
  desc: 'Builds cached versions of the Detox framework and XCUITest-runner in ~/Library/Detox. ' +
    'Use the `--detox` and `--xcuitest` flags to selectively build the framework components. ' +
    'By default, both the injected Detox library and the XCUITest test runner are built. (MacOS only)',

  builder: yargs => yargs
  .option('detox', {
    describe: 'Build only the injected Detox library',
    type: 'boolean',
    default: false
  })
  .option('xcuitest', {
    describe: 'Build only the XCUITest test runner',
    type: 'boolean',
    default: false
  }),

  handler: async function(argv) {
    await build(argv.detox, argv.xcuitest);
  }
};
