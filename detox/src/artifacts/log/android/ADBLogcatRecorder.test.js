const ADBLogcatRecorder = require('./ADBLogcatRecorder');

describe(ADBLogcatRecorder, () => {
  it('should be requireable', () => {
    expect(ADBLogcatRecorder).toBeTruthy();
  });

  it('should create recording', () => {
    const artifactsRegistry = { registerArtifact: jest.fn() };
    const adb = {};
    const processId = 1083;
    const deviceId = 'device';

    const recorder = new ADBLogcatRecorder({
      artifactsRegistry,
      adb,
      deviceId,
      processId,
    });

    const recording = recorder.record();
    expect(artifactsRegistry.registerArtifact).toHaveBeenCalledWith(recording);
    expect(recording.adb).toBe(adb);
    expect(recording.deviceId).toBe(deviceId);
    expect(recording.processId).toBe(processId);
  });
});

