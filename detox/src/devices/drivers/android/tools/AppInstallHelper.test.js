const deviceTempDir = '/mock-tmp-dir';
const deviceId = 'mock-device-id';
const appBinaryPath = '/mock-app-binary-path/binary.apk';
const testBinaryPath = '/mock-test-binary-path/test/binary.apk';

describe('Android app installation helper', () => {
  let adb;
  class MockAdbClass {
    constructor() {
      this.shell = (...args) => adb.shell(...args);
      this.push = (...args) => adb.push(...args);
      this.remoteInstall = (...args) => adb.remoteInstall(...args);
    }
  }

  beforeEach(() => {
    const ADBMock = jest.genMockFromModule('./ADB');
    adb = new ADBMock();
    jest.mock('./ADB', () => MockAdbClass);
  });

  let uut;
  beforeEach(() => {
    const AppInstallHelper = require('./AppInstallHelper');
    uut = new AppInstallHelper(adb, deviceId, deviceTempDir);
  });

  it('should recreate a temp dir on the device', async () => {
    await uut.install(appBinaryPath, testBinaryPath);

    expect(adb.shell).toHaveBeenCalledWith(deviceId, `rm -fr ${deviceTempDir}`);
    expect(adb.shell).toHaveBeenCalledWith(deviceId, `mkdir -p ${deviceTempDir}`);
  });

  it('should throw if shell command fails', async () => {
    adb.shell.mockRejectedValue(new Error('mocked error in adb-shell'));

    try {
      await uut.install(appBinaryPath, testBinaryPath);
      fail('expected to throw');
    } catch (err) {}
  });

  it('should push app-binary file to temp dir on device', async () => {
    await uut.install(appBinaryPath, testBinaryPath);
    expect(adb.push).toHaveBeenCalledWith(deviceId, appBinaryPath, '/mock-tmp-dir/Application.apk');
  });

  it('should push test-binary file to temp dir on device', async () => {
    await uut.install(appBinaryPath, testBinaryPath);
    expect(adb.push).toHaveBeenCalledWith(deviceId, testBinaryPath, '/mock-tmp-dir/Test.apk');
  });

  it('should fail if adb-push fails', async () => {
    adb.push.mockRejectedValue(new Error('mocked error in adb-push'));

    try {
      await uut.install(appBinaryPath, testBinaryPath);
      fail('expected to throw');
    } catch(err) {}
  });

  it('should remote-install both binaries via shell', async () => {
    await uut.install(appBinaryPath, testBinaryPath);
    expect(adb.remoteInstall).toHaveBeenCalledWith(deviceId, '/mock-tmp-dir/Application.apk');
    expect(adb.remoteInstall).toHaveBeenCalledWith(deviceId, '/mock-tmp-dir/Test.apk');
  });

  it('should fail if remote-install fails', async () => {
    adb.remoteInstall.mockRejectedValue(new Error('mocked error in remote-install'));

    try {
      await uut.install(appBinaryPath, testBinaryPath);
      fail('expected to throw');
    } catch(err) {}
  });

  it('should use a default temp-dir', async () => {
    const AppInstallHelper = require('./AppInstallHelper');
    uut = new AppInstallHelper(adb, deviceId, undefined);

    await uut.install(appBinaryPath, testBinaryPath);

    expect(adb.push).toHaveBeenCalledWith(deviceId, appBinaryPath, '/data/local/tmp/detox/Application.apk');
  });
});
