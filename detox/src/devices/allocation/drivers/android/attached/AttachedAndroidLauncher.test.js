describe('Attached Android device "launcher"', () => {
  const adbName = 'mock-attached-emu';

  let eventEmitter;
  let uut;
  beforeEach(() => {
    const AsyncEmitter = jest.genMockFromModule('../../../../../utils/AsyncEmitter');
    eventEmitter = new AsyncEmitter();

    const AttachedAndroidLauncher = require('./AttachedAndroidLauncher');
    uut = new AttachedAndroidLauncher(eventEmitter);
  });

  const expectDeviceBootEvent = () =>
    expect(eventEmitter.emit).toHaveBeenCalledWith('bootDevice', {
      deviceId: adbName,
      coldBoot: false,
      type: 'device',
    });

  it('should emit a boot event', async () => {
    await uut.notifyLaunchCompleted(adbName);
    expectDeviceBootEvent();
  });
});
