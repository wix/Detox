describe('EmulatorDriver', () => {
  let AndroidDriverCleanup;
  let EmulatorDriver;

  beforeEach(() => {
    jest.resetModules();
    AndroidDriverCleanup = jest.fn();

    jest.doMock('../AndroidDriver', () => class AndroidDriver {
      constructor() {}

      async cleanup(bundleId) {
        AndroidDriverCleanup(bundleId);
      }
    });

    EmulatorDriver = require('./EmulatorDriver');
  });

  afterEach(() => {
    delete process.env.ANDROID_ADB_SERVER_PORT;
  });

  it('should set ANDROID_ADB_SERVER_PORT on init and restore it on cleanup', async () => {
    process.env.ANDROID_ADB_SERVER_PORT = '7000';
    const uut = new EmulatorDriver({}, {
      adbName: 'emulator-5554',
      adbServerPort: 5038,
      avdName: 'Pixel',
      forceAdbInstall: false,
    });

    await uut.init();
    expect(process.env.ANDROID_ADB_SERVER_PORT).toBe('5038');

    await uut.cleanup('bundle.id');
    expect(process.env.ANDROID_ADB_SERVER_PORT).toBe('7000');
    expect(AndroidDriverCleanup).toHaveBeenCalledWith('bundle.id');
  });

  it('should clear ANDROID_ADB_SERVER_PORT on cleanup when it was previously unset', async () => {
    const uut = new EmulatorDriver({}, {
      adbName: 'emulator-5554',
      adbServerPort: 5038,
      avdName: 'Pixel',
      forceAdbInstall: false,
    });

    await uut.init();
    expect(process.env.ANDROID_ADB_SERVER_PORT).toBe('5038');

    await uut.cleanup('bundle.id');
    expect(process.env.ANDROID_ADB_SERVER_PORT).toBeUndefined();
  });
});
