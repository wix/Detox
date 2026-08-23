const fs = require('fs');
const path = require('path');

const maxWorkersMap = {
  'android.emulator': 3,
  'android.genycloud': 5,
  'android.genycloud-arm64': 2,
  'ios.simulator': 2,
};

module.exports = async () => {
  // `detox test` writes the composed configuration to a file and names it
  // to the runner through the environment.
  const config = JSON.parse(fs.readFileSync(process.env.DETOX_CONFIG_SNAPSHOT_PATH, 'utf8'));

  const reporters = [
    '<rootDir>/runners/jest/reporter',
  ];

  if (process.env.DISABLE_JUNIT_REPORTER !== '1') {
    reporters.push('<rootDir>/test/node_modules/jest-junit');
  }

  let deviceType = config.device.type;
  if (config.configurationName.endsWith('arm64')) {
    deviceType += '-arm64';
  }

  return {
    'rootDir': path.join(__dirname, '../..'),
    'testEnvironment': './test/e2e/testEnvironment.js',
    'testMatch': [
      '<rootDir>/test/e2e/**/*.test.{js,ts}',
    ],
    'setupFilesAfterEnv': ['./test/e2e/utils/rnSkipper.js', './test/e2e/setup.js'],
    'globalSetup': '<rootDir>/runners/jest/globalSetup',
    'globalTeardown': '<rootDir>/runners/jest/globalTeardown',
    'testTimeout': 120000,
    'reporters': reporters,
    'verbose': true,
    'bail': false,
    'maxWorkers': process.env.CI ? maxWorkersMap[deviceType] || 1 : 1,
  };
};
