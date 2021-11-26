// @ts-nocheck
const DetoxRuntimeErrorComposer = require('./DetoxRuntimeErrorComposer');

describe('DetoxRuntimeErrorComposer', () => {
  /** @type () => DetoxRuntimeErrorComposer */
  let builder;
  let appsConfig;

  beforeEach(() => {
    builder = () => new DetoxRuntimeErrorComposer({ appsConfig });
  });

  test('abortedDetoxInit', () => {
    expect(builder().abortedDetoxInit()).toMatchSnapshot();
  });

  test('invalidTestSummary - beforeEach', () => {
    expect(builder().invalidTestSummary('beforeEach', 'deviceName')).toMatchSnapshot();
  });

  test('invalidTestSummary - afterEach', () => {
    expect(builder().invalidTestSummary('afterEach', { weird: [['string']] })).toMatchSnapshot();
  });

  test('invalidTestSummary - afterEach', () => {
    expect(builder().invalidTestSummary('afterEach', {
      title: 'foo test',
      fullName: 'suite foo test',
      status: 'uncertain',
    })).toMatchSnapshot();
  });

  test('invalidTestSummaryStatus - afterEach', () => {
    expect(builder().invalidTestSummaryStatus('afterEach', {
      summary: 'invalid stuff',
    })).toMatchSnapshot();
  });

  test('cantFindApp - single app', () => {
    appsConfig = {
      default: {
        type: 'ios.app',
        binaryPath: 'path/to/app',
      }
    };

    expect(builder().cantFindApp('unicorn')).toMatchSnapshot();
  });

  test('cantFindApp - multiple apps', () => {
    appsConfig = {
      fish: {},
      chips: {},
      hummus: {},
      beer: {},
    };

    expect(builder().cantFindApp('steak')).toMatchSnapshot();
  });
});
