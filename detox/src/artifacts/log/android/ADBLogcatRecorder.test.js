const ADBLogcatRecorder = require('./ADBLogcatRecorder');

describe(ADBLogcatRecorder, () => {
  it('should be requireable', () => {
    expect(ADBLogcatRecorder).toBeTruthy();
  });

  it('should create recording', () => {
    const artifactsRegistry = { registerArtifact: jest.fn() };
    const adb = {};
    const bundleId = 'bundle';
    const deviceId = 'device';

    const recorder = new ADBLogcatRecorder({
      artifactsRegistry,
      adb,
      bundleId,
      deviceId,
    });

    const recording = recorder.record();
    expect(artifactsRegistry.registerArtifact).toHaveBeenCalledWith(recording);
    expect(recording.adb).toBe(adb);
    expect(recording.bundleId).toBe(bundleId);
    expect(recording.deviceId).toBe(deviceId);
  });
});

