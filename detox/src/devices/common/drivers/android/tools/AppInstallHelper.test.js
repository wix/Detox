// @ts-nocheck
const deviceId = 'mock-device-id';
const appBinaryPath = '/mock-app-binary-path/binary.apk';
const testBinaryPath = '/mock-test-binary-path/test/binary.apk';

describe('Android app installation helper', () => {
  let adb;

  beforeEach(() => {
    const ADBMock = jest.createMockFromModule('../exec/ADB');
    adb = new ADBMock();
  });

  let fileTransfer;
  let uut;
  beforeEach(() => {
    const FileTransfer = jest.createMockFromModule('./FileTransfer');
    fileTransfer = new FileTransfer(adb, '/mock-destination-dir');

    const AppInstallHelper = require('./AppInstallHelper');
    uut = new AppInstallHelper(adb, fileTransfer);
  });

  it('should recreate the transient dir on the device', async () => {
    await uut.install(appBinaryPath, testBinaryPath);
    expect(fileTransfer.prepareDestinationDir).toHaveBeenCalledWith();
  });

  it('should throw if transient dir prep fails', async () => {
    fileTransfer.prepareDestinationDir.mockRejectedValue(new Error('mocked error in adb-shell'));

    await expect(uut.install(appBinaryPath, testBinaryPath)).rejects.toThrow();
  });

  it('should push app-binary file to the device', async () => {
    await uut.install(appBinaryPath, testBinaryPath);
    expect(fileTransfer.send).toHaveBeenCalledWith(appBinaryPath, 'Application.apk');
  });

  it('should push test-binary file to the device', async () => {
    await uut.install(appBinaryPath, testBinaryPath);
    expect(fileTransfer.send).toHaveBeenCalledWith(testBinaryPath, 'Test.apk');
  });

  it('should break if file push fails', async () => {
    fileTransfer.send.mockRejectedValue(new Error('mocked error in adb-push'));

    await expect(uut.install(appBinaryPath, testBinaryPath)).rejects.toThrow();
  });

  it('should remote-install both binaries via shell', async () => {
    fileTransfer.send
      .mockReturnValueOnce('/mocked-final-dir/first.apk')
      .mockReturnValueOnce('/mocked-final-dir/second.apk');

    await uut.install(appBinaryPath, testBinaryPath);
    expect(adb.remoteInstall).toHaveBeenCalledWith('/mocked-final-dir/first.apk');
    expect(adb.remoteInstall).toHaveBeenCalledWith('/mocked-final-dir/second.apk');
  });

  it('should break if remote-install fails', async () => {
    adb.remoteInstall.mockRejectedValue(new Error('mocked error in remote-install'));

    await expect(uut.install(appBinaryPath, testBinaryPath)).rejects.toThrow();
  });

  it('should allow for an install with no test binary', async () => {
    fileTransfer.send
      .mockReturnValueOnce('/mocked-final-dir/first.apk')
      .mockReturnValueOnce('/mocked-final-dir/second.apk');

    await uut.install(appBinaryPath, undefined);
    expect(fileTransfer.send).toHaveBeenCalledTimes(1);
    expect(adb.remoteInstall).toHaveBeenCalledWith('/mocked-final-dir/first.apk');
    expect(adb.remoteInstall).toHaveBeenCalledTimes(1);
  });
});
