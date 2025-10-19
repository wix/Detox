// @ts-nocheck
jest.mock('../../../common/drivers/ios/tools/AppleSimUtils');
jest.mock('../../../common/drivers/ios/tools/SimulatorAppCache');

describe('AppStateResetFallback', () => {
  let AppStateResetFallback;
  let appStateResetFallback;
  let AppleSimUtils;
  let applesimutils;
  let SimulatorAppCache;
  let simulatorAppCache;

  beforeEach(() => {
    AppleSimUtils = jest.requireMock('../../../common/drivers/ios/tools/AppleSimUtils');
    applesimutils = new AppleSimUtils();
    applesimutils.uninstall.mockResolvedValue();

    SimulatorAppCache = jest.requireMock('../../../common/drivers/ios/tools/SimulatorAppCache');
    simulatorAppCache = new SimulatorAppCache({ applesimutils });
    simulatorAppCache.backup.mockResolvedValue();
    simulatorAppCache.restore.mockResolvedValue();

    AppStateResetFallback = require('./AppStateResetFallback');
    appStateResetFallback = new AppStateResetFallback({ applesimutils, appCache: simulatorAppCache });
  });

  it('should create SimulatorAppCache with applesimutils', () => {
    expect(() => new AppStateResetFallback({ applesimutils })).not.toThrow();
    expect(SimulatorAppCache).toHaveBeenCalledWith({ applesimutils });
  });

  it('should reset app state by backing up then restoring all apps', async () => {
    const udid = 'test-device-123';
    const bundleIds = ['com.app1', 'com.app2'];

    await appStateResetFallback.resetAppState(udid, bundleIds);

    expect(simulatorAppCache.backup).toHaveBeenCalledTimes(2);
    expect(simulatorAppCache.backup).toHaveBeenCalledWith(udid, 'com.app1');
    expect(simulatorAppCache.backup).toHaveBeenCalledWith(udid, 'com.app2');

    expect(applesimutils.uninstall).toHaveBeenCalledTimes(2);
    expect(applesimutils.uninstall).toHaveBeenCalledWith(udid, 'com.app1');
    expect(applesimutils.uninstall).toHaveBeenCalledWith(udid, 'com.app2');

    expect(simulatorAppCache.restore).toHaveBeenCalledTimes(2);
    expect(simulatorAppCache.restore).toHaveBeenCalledWith(udid, 'com.app1');
    expect(simulatorAppCache.restore).toHaveBeenCalledWith(udid, 'com.app2');
  });

  it('should handle empty bundle IDs array', async () => {
    await appStateResetFallback.resetAppState('udid', []);

    expect(simulatorAppCache.backup).not.toHaveBeenCalled();
    expect(applesimutils.uninstall).not.toHaveBeenCalled();
    expect(simulatorAppCache.restore).not.toHaveBeenCalled();
  });

  describe('invalidate', () => {
    const udid = 'test-device-123';
    const bundleId = 'com.test.app';
    const binaryPath = '/path/to/app/binary.app';

    beforeEach(() => {
      simulatorAppCache.remove.mockResolvedValue();
      simulatorAppCache.cleanup.mockResolvedValue();
    });

    it('should invalidate specific app cache when bundleId is provided', async () => {
      await appStateResetFallback.invalidate(udid, bundleId);

      expect(simulatorAppCache.remove).toHaveBeenCalledWith(udid, bundleId);
      expect(simulatorAppCache.cleanup).not.toHaveBeenCalled();
    });

    it('should invalidate entire device cache when bundleId is not provided', async () => {
      await appStateResetFallback.invalidate(udid);

      expect(simulatorAppCache.cleanup).toHaveBeenCalledWith(udid);
      expect(simulatorAppCache.remove).not.toHaveBeenCalled();
    });
  });
});
