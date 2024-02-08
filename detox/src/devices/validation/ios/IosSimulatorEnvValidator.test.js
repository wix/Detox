// @ts-nocheck
describe('iOS simulator test environment validator', () => {
  const DETOX_FRAMEWORK_PATH = '/path/to/framework';
  const DETOX_XCUITEST_RUNNER_PATH = '/path/to/xcuitest-runner';

  const pathToExistenceMap = {};
  const mockPathExistence = (frameworkExists, xcuitestExists) => {
    pathToExistenceMap[DETOX_FRAMEWORK_PATH] = frameworkExists;
    pathToExistenceMap[DETOX_XCUITEST_RUNNER_PATH] = xcuitestExists;
  };

  let environment;
  let uut;
  beforeEach(() => {
    jest.mock('../../utils/environment');
    environment = require('../../utils/environment');
    environment.getFrameworkPath.mockResolvedValue(DETOX_FRAMEWORK_PATH);
    environment.getXCUITestRunnerPath.mockResolvedValue(DETOX_XCUITEST_RUNNER_PATH);

    jest.mock('fs');
    const fs = require('fs');
    fs.existsSync = (path) => {
      return pathToExistenceMap[path] || false;
    };

    const IosSimulatorEnvValidator = require('./IosSimulatorEnvValidator');
    uut = new IosSimulatorEnvValidator();
  });

  it('should throw an error when framework does not exists', async () => {
    mockPathExistence(false, true);

    try {
      await uut.validate();
      fail('Expected an error');
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it('should throw an error when xcuitest does not exists', async () => {
    mockPathExistence(true, false);

    try {
      await uut.validate();
      fail('Expected an error');
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  it('should not throw an error when both framework and xcuitest exist', async () => {
    mockPathExistence(true, true);

    await uut.validate();
  });
});
