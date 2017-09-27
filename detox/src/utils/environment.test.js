const _ = require('lodash');

describe('Environment', () => {
  let Environment;
  let originalProcessEnv;

  beforeEach(() => {
    originalProcessEnv = _.cloneDeep(process.env);
    Environment = require('./environment');
  });

  beforeEach(() => {
    process.env = _.cloneDeep(originalProcessEnv);
    Environment = require('./environment');
  });

  it(`ANDROID_SDK_ROOT and ANDROID_HOME are defined, prefer ANDROID_SDK_ROOT`, () => {
    process.env.ANDROID_SDK_ROOT = 'path/to/sdk/root';
    process.env.ANDROID_HOME = 'path/to/android/home';

    const path = Environment.getAndroidSDKPath();
    expect(path).toEqual('path/to/sdk/root');
  });

  it(`ANDROID_HOME is defined`, () => {
    process.env.ANDROID_SDK_ROOT = undefined;
    process.env.ANDROID_HOME = 'path/to/android/home';

    const path = Environment.getAndroidSDKPath();
    expect(path).toEqual('path/to/android/home');
  });

  it(`ANDROID_SDK_ROOT and ANDROID_HOME are not defined`, () => {
    process.env.ANDROID_SDK_ROOT = undefined;
    process.env.ANDROID_HOME = undefined;

    expect(Environment.getAndroidSDKPath)
      .toThrow('$ANDROID_SDK_ROOT is not defined, set the path to the SDK installation directory into $ANDROID_SDK_ROOT');

  });
});

