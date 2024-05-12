const { clean } = require('./utils/frameworkUtils');

module.exports = {
  command: 'clean-framework-cache',
  desc: 'Cleans cached versions of the Detox framework and XCUITest-runner in ~/Library/Detox. ' +
    'Use the `--detox` and `--xcuitest` flags to selectively clean the framework components. ' +
    'By default, both the injected Detox library and the XCUITest test runner are cleaned. (MacOS only)',

  builder: yargs => yargs
  .option('detox', {
    describe: 'Clean only the injected Detox library',
    type: 'boolean',
    default: false
  })
  .option('xcuitest', {
    describe: 'Clean only the XCUITest test runner',
    type: 'boolean',
    default: false
  }),

  handler: async function(argv) {
    await clean(argv.detox, argv.xcuitest);
  }
};
