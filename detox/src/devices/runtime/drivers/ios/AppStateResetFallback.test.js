// @ts-nocheck
const AppStateResetFallback = require('./AppStateResetFallback');

jest.mock('../../../common/drivers/ios/tools/AppleSimUtils');
jest.mock('../../../common/drivers/ios/tools/SimulatorAppCache');

/** @type {*} */
const AppleSimUtils = require('../../../common/drivers/ios/tools/AppleSimUtils');
/** @type {*} */
const SimulatorAppCache = require('../../../common/drivers/ios/tools/SimulatorAppCache');

describe('AppStateResetFallback', () => {
  let applesimutils;
  let appStateResetFallback;
  let appCache;

  beforeEach(() => {
    applesimutils = new AppleSimUtils();

    appCache = new SimulatorAppCache();
    appCache.pull.mockResolvedValue();
    appCache.push.mockResolvedValue();

    appStateResetFallback = new AppStateResetFallback({ appCache });
  });

  it('should create SimulatorAppCache with applesimutils', () => {
    expect(() => new AppStateResetFallback({ applesimutils })).not.toThrow();
    expect(SimulatorAppCache).toHaveBeenCalledWith({ applesimutils });
  });

  it('should reset app state by pulling then pushing all apps', async () => {
    const udid = 'test-device-123';
    const bundleIds = ['com.app1', 'com.app2'];

    await appStateResetFallback.resetAppState(udid, bundleIds);

    expect(appCache.pull).toHaveBeenCalledTimes(2);
    expect(appCache.pull).toHaveBeenCalledWith(udid, 'com.app1');
    expect(appCache.pull).toHaveBeenCalledWith(udid, 'com.app2');

    expect(appCache.push).toHaveBeenCalledTimes(2);
    expect(appCache.push).toHaveBeenCalledWith(udid, 'com.app1');
    expect(appCache.push).toHaveBeenCalledWith(udid, 'com.app2');
  });

  it('should handle empty bundle IDs array', async () => {
    await appStateResetFallback.resetAppState('udid', []);

    expect(appCache.pull).not.toHaveBeenCalled();
    expect(appCache.push).not.toHaveBeenCalled();
  });
});
