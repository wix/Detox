const { build, clean } = require('./utils/frameworkUtils');

module.exports = {
  command: 'rebuild-framework-cache',
  desc: 'Rebuilds cached versions of the Detox framework and XCUITest-runner in ~/Library/Detox. ' +
    'Use the `--detox` and `--xcuitest` flags to selectively rebuild the framework components. ' +
    'By default, both the injected Detox library and the XCUITest test runner are rebuilt. (MacOS only)',

  builder: yargs => yargs
  .option('detox', {
    describe: 'Rebuild only the injected Detox library',
    type: 'boolean',
    default: false
  })
  .option('xcuitest', {
    describe: 'Rebuild only the XCUITest test runner',
    type: 'boolean',
    default: false
  }),

  handler: async function(argv) {
    await clean(argv.detox, argv.xcuitest);
    await build(argv.detox, argv.xcuitest);
  }
};
