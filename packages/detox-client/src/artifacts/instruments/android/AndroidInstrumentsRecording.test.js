// @ts-nocheck
const AndroidInstrumentsRecording = require('./AndroidInstrumentsRecording');

describe('AndroidInstrumentsRecording', () => {
  const deviceId = 'SomeDeviceId';
  const temporaryRecordingPath = 'SomeTemporaryRecordingPath';
  const artifactPath = 'SomeArtifactPath';

  let mockedAdb, recording;

  beforeEach(() => {
    mockedAdb = {
      pull: jest.fn(),
      rm: jest.fn()
    };
    recording = new AndroidInstrumentsRecording({
      adb: mockedAdb,
      deviceId,
      temporaryRecordingPath
    });
  });

  it('should pull & remove artifact via adb on save', async () => {
    await recording.doSave(artifactPath);
    expect(mockedAdb.pull).toBeCalledWith(deviceId, temporaryRecordingPath, artifactPath);
    expect(mockedAdb.rm).toBeCalledWith(deviceId, temporaryRecordingPath, true);
  });

  it('should remove artifact via adb on discard', async () => {
    await recording.doDiscard(artifactPath);
    expect(mockedAdb.rm).toBeCalledWith(deviceId, temporaryRecordingPath, true);
  });
});
