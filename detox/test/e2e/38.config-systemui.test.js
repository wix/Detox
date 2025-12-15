const {expectDeviceSnapshotToMatch} = require('./utils/snapshot');

describe(':android: System UI configuration', () => {
  it('should match home screen snapshot with system UI configuration', async () => {
    await device.sendToHome();
    await expectDeviceSnapshotToMatch('detox-config.systemui-basic');
  });
});
