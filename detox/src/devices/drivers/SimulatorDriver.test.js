jest.mock('../registries/SimulatorDeviceRegistry');
jest.mock('../../utils/logger');
jest.mock('../../utils/environment', () => ({
  getFrameworkPath: () => '',
  getDeviceLockFilePath: () => '',
}));

describe('SimulatorDriver', () => {
  let log;
  let SimulatorDriver;

  beforeEach(() => {
    log = require('../../utils/logger');
    SimulatorDriver = require('./SimulatorDriver');
  });

  it('should throw error if detox framework path has not been found', async () => {
    const driver = new SimulatorDriver({ client: null });

    await expect(driver.prepare()).rejects.toThrowErrorMatchingSnapshot();
  });

  it('should log error to log if cannot acquire free device from the registry', async () => {
    const driver = new SimulatorDriver({ client: null });
    driver.deviceRegistry.acquireDevice = jest.fn();

    await driver.acquireFreeDevice('test string');
    expect(log.error.mock.calls).toMatchSnapshot();
  });
});
