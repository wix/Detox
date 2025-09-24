// @ts-nocheck
const deviceId = 'mock-device-id';
const bundleId = 'mock-bundle-id';
const testBundleId = 'mock-bundle-id.test';

describe('Android app uninstall helper', () => {
  let adb;
  beforeEach(() => {
    const ADBClass = jest.createMockFromModule('../exec/ADB');
    adb = new ADBClass();
    adb.isPackageInstalled.mockResolvedValue(true);
  });

  let uut;
  beforeEach(() => {
    const AppUninstallHelper = require('./AppUninstallHelper');
    uut = new AppUninstallHelper(adb);
  });

  it('should uninstall the app\'s binary using adb', async () => {
    await uut.uninstall(bundleId);
    expect(adb.uninstall).toHaveBeenCalledWith(bundleId);
  });

  it('should fail if app uninstall fails', async () => {
    adb.uninstall.mockRejectedValue(new Error('mocked error in adb.uninstall'));
    await expect(uut.uninstall(bundleId)).rejects.toThrow();
  });

  it('should avoid uninstalling app if not already installed', async () => {
    adb.isPackageInstalled.mockResolvedValue(false);

    await uut.uninstall(bundleId);

    expect(adb.isPackageInstalled).toHaveBeenCalledWith(bundleId);
    expect(adb.uninstall).not.toHaveBeenCalledWith(bundleId);
  });

  it('should uninstall the test binary using adb', async () => {
    await uut.uninstall(bundleId);
    expect(adb.uninstall).toHaveBeenCalledWith(testBundleId);
  });

  it('should fail if test binary uninstall fails', async () => {
    adb.uninstall
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error('mocked error in adb.uninstall'));

    await expect(uut.uninstall(bundleId)).rejects.toThrow();
  });

  it('should avoid uninstalling test binary if not already installed', async () => {
    adb.isPackageInstalled
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    await uut.uninstall(bundleId);

    expect(adb.isPackageInstalled).toHaveBeenCalledWith(testBundleId);
    expect(adb.uninstall).not.toHaveBeenCalledWith(testBundleId);
  });
});
