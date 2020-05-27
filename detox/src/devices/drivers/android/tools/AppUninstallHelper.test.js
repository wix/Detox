const deviceId = 'mock-device-id';
const bundleId = 'mock-bundle-id';
const testBundleId = 'mock-bundle-id.test';

describe('Android app uninstall helper', () => {
  let adb;
  class MockAdbClass {
    constructor() {
      this.uninstall = (...args) => adb.uninstall(...args);
      this.isPackageInstalled = (...args) => adb.isPackageInstalled(...args);
    }
  }

  beforeEach(() => {
    const ADBMock = jest.genMockFromModule('./ADB');
    adb = new ADBMock();
    adb.isPackageInstalled.mockResolvedValue(true);

    jest.mock('./ADB', () => MockAdbClass);
  });

  let uut;
  beforeEach(() => {
    const AppUninstallHelper = require('./AppUninstallHelper');
    uut = new AppUninstallHelper(adb);
  });

  it('should uninstall the app\'s binary using adb', async () => {
    await uut.uninstall(deviceId, bundleId);
    expect(adb.uninstall).toHaveBeenCalledWith(deviceId, bundleId);
  });

  it('should fail if app uninstall fails', async () => {
    adb.uninstall.mockRejectedValue(new Error('mocked error in adb.uninstall'));
    try {
      await uut.uninstall(deviceId, bundleId);
      fail('expected an error');
    } catch (err) {}
  });

  it('should avoid uninstalling app if not already installed', async () => {
    adb.isPackageInstalled.mockResolvedValue(false);

    await uut.uninstall(deviceId, bundleId);

    expect(adb.isPackageInstalled).toHaveBeenCalledWith(deviceId, bundleId);
    expect(adb.uninstall).not.toHaveBeenCalledWith(deviceId, bundleId);
  });

  it('should uninstall the test binary using adb', async () => {
    await uut.uninstall(deviceId, bundleId);
    expect(adb.uninstall).toHaveBeenCalledWith(deviceId, testBundleId);
  });

  it('should fail if test binary uninstall fails', async () => {
    adb.uninstall
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error('mocked error in adb.uninstall'));

    try {
      await uut.uninstall(deviceId, bundleId);
      fail('expected an error');
    } catch (err) {}
  });

  it('should avoid uninstalling test binary if not already installed', async () => {
    adb.isPackageInstalled
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    await uut.uninstall(deviceId, bundleId);

    expect(adb.isPackageInstalled).toHaveBeenCalledWith(deviceId, testBundleId);
    expect(adb.uninstall).not.toHaveBeenCalledWith(deviceId, testBundleId);
  });
});
