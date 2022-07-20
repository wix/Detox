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
});
