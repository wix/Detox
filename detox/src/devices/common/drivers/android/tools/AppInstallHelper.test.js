const deviceId = 'mock-device-id';
const appBinaryPath = '/mock-app-binary-path/binary.apk';
const testBinaryPath = '/mock-test-binary-path/test/binary.apk';

describe('Android app installation helper', () => {
  let adb;

  beforeEach(() => {
    const ADBMock = jest.genMockFromModule('../exec/ADB');
    adb = new ADBMock();
  });

  let fileXfer;
  let uut;
  beforeEach(() => {
    const TempFileXfer = jest.genMockFromModule('./TempFileXfer');
    fileXfer = new TempFileXfer();

    const AppInstallHelper = require('./AppInstallHelper');
    uut = new AppInstallHelper(adb, fileXfer);
  });

  it('should recreate the transient dir on the device', async () => {
    await uut.install(deviceId, appBinaryPath, testBinaryPath);
    expect(fileXfer.prepareDestinationDir).toHaveBeenCalledWith(deviceId);
  });

  it('should throw if transient dir prep fails', async () => {
    fileXfer.prepareDestinationDir.mockRejectedValue(new Error('mocked error in adb-shell'));

    try {
      await uut.install(deviceId, appBinaryPath, testBinaryPath);
      fail('expected to throw');
    } catch (err) {}
  });

  it('should push app-binary file to the device', async () => {
    await uut.install(deviceId, appBinaryPath, testBinaryPath);
    expect(fileXfer.send).toHaveBeenCalledWith(deviceId, appBinaryPath, 'Application.apk');
  });

  it('should push test-binary file to the device', async () => {
    await uut.install(deviceId, appBinaryPath, testBinaryPath);
    expect(fileXfer.send).toHaveBeenCalledWith(deviceId, testBinaryPath, 'Test.apk');
  });

  it('should break if file push fails', async () => {
    fileXfer.send.mockRejectedValue(new Error('mocked error in adb-push'));

    try {
      await uut.install(deviceId, appBinaryPath, testBinaryPath);
      fail('expected to throw');
    } catch(err) {}
  });

  it('should remote-install both binaries via shell', async () => {
    fileXfer.send
      .mockReturnValueOnce('/mocked-final-dir/first.apk')
      .mockReturnValueOnce('/mocked-final-dir/second.apk');

    await uut.install(deviceId, appBinaryPath, testBinaryPath);
    expect(adb.remoteInstall).toHaveBeenCalledWith(deviceId, '/mocked-final-dir/first.apk');
    expect(adb.remoteInstall).toHaveBeenCalledWith(deviceId, '/mocked-final-dir/second.apk');
  });

  it('should break if remote-install fails', async () => {
    adb.remoteInstall.mockRejectedValue(new Error('mocked error in remote-install'));

    try {
      await uut.install(deviceId, appBinaryPath, testBinaryPath);
      fail('expected to throw');
    } catch(err) {}
  });

  it('should allow for an install with no test binary', async () => {
    fileXfer.send
      .mockReturnValueOnce('/mocked-final-dir/first.apk')
      .mockReturnValueOnce('/mocked-final-dir/second.apk');

    await uut.install(deviceId, appBinaryPath, undefined);
    expect(fileXfer.send).toHaveBeenCalledTimes(1);
    expect(adb.remoteInstall).toHaveBeenCalledWith(deviceId, '/mocked-final-dir/first.apk');
    expect(adb.remoteInstall).toHaveBeenCalledTimes(1);
  });

  describe('reinstall if needed', () => {
    const bundleId = 'com.wix.detox.test';

    it('should check if package is installed via shell', async () => {
      await uut.checkInstalled(deviceId, bundleId);
      expect(adb.checkInstalled).toHaveBeenCalledWith(deviceId, bundleId);
      expect(adb.checkInstalled).toHaveBeenCalledTimes(1);
    });

    it('should clear user data via shell', async () => {
      await uut.clearUserData(deviceId, bundleId);
      expect(adb.clearUserData).toHaveBeenCalledWith(deviceId, bundleId);
      expect(adb.clearUserData).toHaveBeenCalledTimes(1);
    });

    it('should get remote package version number via shell', async () => {
      await uut.getRemoteVersionNumber(deviceId, bundleId);
      expect(adb.getRemoteVersionNumber).toHaveBeenCalledWith(deviceId, bundleId);
      expect(adb.getRemoteVersionNumber).toHaveBeenCalledTimes(1);
    });

    it('should extract package version number from shell returned value', async () => {
      adb.getRemoteVersionNumber.mockReturnValue('');
      const withEmptyAdbResponse = await uut.getRemoteVersionNumber(deviceId, bundleId);
      expect(withEmptyAdbResponse).toEqual('');

      adb.getRemoteVersionNumber.mockReturnValue('Failed');
      const withUnexpectedAdbResponse = await uut.getRemoteVersionNumber(deviceId, bundleId);
      expect(withUnexpectedAdbResponse).toEqual('');

      adb.getRemoteVersionNumber.mockReturnValue('versionNumber=1.9.0');
      const withExpectedAdbResponse = await uut.getRemoteVersionNumber(deviceId, bundleId);
      expect(withExpectedAdbResponse).toEqual('1.9.0');
    });

    it('should check local version number', async () => {
      const withWorkingDirectory = await uut.getLocalVersionNumber(deviceId, bundleId);
      expect(withWorkingDirectory).not.toEqual('');

      process.cwd = () => '';
      const withoutWorkingDirectory = await uut.getLocalVersionNumber(deviceId, bundleId);
      expect(withoutWorkingDirectory).toEqual('');
    });
  });
});
