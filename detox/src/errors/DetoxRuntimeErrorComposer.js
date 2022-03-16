const _ = require('lodash');

const DetoxRuntimeError = require('./DetoxRuntimeError');

const J = s => JSON.stringify(s);

class DetoxRuntimeErrorComposer {
  constructor({ appsConfig }) {
    this.appsConfig = appsConfig;
  }

  abortedDetoxInit() {
    return new DetoxRuntimeError({
      message: 'Aborted detox.init() execution, and now running detox.cleanup()',
      hint: 'Most likely, your test runner is tearing down the suite due to the timeout error'
    });
  }

  invalidTestSummary(methodName, testSummary) {
    return new DetoxRuntimeError({
      message: `Invalid test summary was passed to detox.${methodName}(testSummary)` +
        '\nExpected to get an object of type: { title: string; fullName: string; status: "running" | "passed" | "failed"; }',
      hint: 'Maybe you are still using an old undocumented signature detox.beforeEach(string, string, string) in init.js ?' +
        '\nSee the article for the guidance: ' +
        'https://wix.github.io/Detox/docs/api/test-lifecycle' +
        '\ntestSummary was: ',
        debugInfo: testSummary,
    });
  }

  invalidTestSummaryStatus(methodName, testSummary) {
    return new DetoxRuntimeError({
      message: `Invalid test summary status was passed to detox.${methodName}(testSummary). Valid values are: "running", "passed", "failed"`,
      hint: "It seems like you've hit a Detox integration issue with a test runner. " +
        'You are encouraged to report it in Detox issues on GitHub.' +
        '\ntestSummary was: ',
      debugInfo: testSummary,
    });
  }

  cantFindApp(attemptedName) {
    const appCount = _.keys(this.appsConfig).length;

    return new DetoxRuntimeError({
      message: `Can't find an app config with name ${J(attemptedName)}.`,
      hint: appCount < 2
        ? `Actually, you don't have multiple apps defined in your config.\n` +
          `Hence, either you don't need to call device.selectApp(${J(attemptedName)}) at all,\n` +
          `or, your apps config is missing that app. See the actual contents:`
        : `Maybe you meant one of these app names?\n` + toStarlist(this.appsConfig),
      debugInfo: appCount < 2 ? this.appsConfig : undefined,
      inspectOptions: { depth: 2 },
    });
  }

  cantSelectEmptyApp() {
    return new DetoxRuntimeError({
      message: `Forbidden method call: device.selectApp(app) cannot be called without arguments.`,
      hint: 'Pass the name of the app or an app config. See Device API docs for more details.'
    });
  }

  appNotSelected() {
    return new DetoxRuntimeError({
      message: `To perform any app-specific action on the device, you should select the app first.`,
      hint: 'Make sure you call `await device.selectApp("your app name")`, where the app name is one of:\n' +
        toStarlist(this.appsConfig)
    });
  }
}

function toStarlist(dictionary) {
  return _.keys(dictionary).map(c => `* ${c}`).join('\n');
}

module.exports = DetoxRuntimeErrorComposer;
