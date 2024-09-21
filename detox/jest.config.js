const DEBUG = process.argv.includes('--reporters');

/** @type{import('jest-allure2-reporter').ReporterOptions} */
const jestAllure2ReporterOptions = {
  testCase: {
    labels: {
      package: ({ filePath }) => `unit.${filePath.slice(1, -1).join('.')}`,
      testMethod: ({ testCase }) => testCase.fullName,
      tag: ['unit'],
    },
  },
};

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  setupFiles: [
    '<rootDir>/__tests__/setupJest.js'
  ],
  testEnvironment: DEBUG ? 'node' : 'jest-allure2-reporter/environment-node',
  testRunner: 'jest-circus/runner',
  roots: [
    'node_modules',
    'local-cli',
    'src',
    'runners'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    'local-cli/test.js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '__tests__',
    '.test.js$',
    '.mock.js$',
    'index.js',
    'internals.js',
    'local-cli/utils',
    'src/environmentFactory',
    'src/android/espressoapi',
    'src/artifacts/factories/index.js',
    'src/artifacts/providers/index.js',
    'src/artifacts/log',
    'src/artifacts/screenshot',
    'src/artifacts/video',
    'src/devices/allocation/drivers/android/emulator/launchEmulatorProcess.js',
    'src/devices/allocation/drivers/android/emulator/patchAvdSkinConfig.js',
    'src/devices/allocation/.*AllocDriver.js',
    'src/devices/allocation/drivers/ios',
    'src/devices/allocation/factories',
    'src/devices/allocation/factories/drivers',
    'src/devices/cookies',
    'src/devices/common/drivers/android/exec/ADB.js',
    'src/devices/common/drivers/android/emulator/exec/EmulatorExec.js',
    'src/devices/common/drivers/android/tools/EmulatorTelnet.js',
    'src/devices/common/drivers/ios/tools',
    'src/devices/runtime/drivers/android/AndroidDriver.js',
    'src/devices/runtime/drivers/android/emulator/EmulatorDriver.js',
    'src/devices/runtime/drivers/DeviceDriverBase.js',
    'src/devices/runtime/drivers/ios',
    'src/devices/runtime/factories',
    'src/devices/runtime/factories/drivers',
    'src/devices/validation/EnvironmentValidatorBase.js',
    'src/devices/validation/factories',
    'src/matchers/factories',
    'src/utils/appdatapath.js',
    'src/utils/debug.js',
    'src/utils/environment.js',
    'src/utils/logger.js',
    'src/utils/pipeCommands.js',
    'src/utils/pressAnyKey.js',
    'src/utils/shellUtils.js',
    'runners/jest/reporters',
    'runners/jest/testEnvironment',
    'src/DetoxWorker.js',
    'src/logger/utils/streamUtils.js',
    'src/realms',
    'src/copilot',
  ],
  resetMocks: true,
  resetModules: true,
  reporters: [
    'default',
    [
      'jest-allure2-reporter',
      jestAllure2ReporterOptions,
    ]
  ],
  coverageReporters: [
    'html',
    'json',
    'text',
    'clover',
    [
      'lcov',
      {
        projectRoot: '..'
      }
    ]
  ],
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100
    }
  }
};
