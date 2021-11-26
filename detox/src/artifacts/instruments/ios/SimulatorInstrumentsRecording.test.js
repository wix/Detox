// @ts-nocheck
const fs = require('fs-extra');

const log = require('../../../utils/logger');
const FileArtifact = require('../../templates/artifact/FileArtifact');

const SimulatorInstrumentsRecording = require('./SimulatorInstrumentsRecording');

jest.mock('fs-extra');
jest.mock('../../templates/artifact/FileArtifact');
jest.mock('../../../utils/logger');

describe('SimulatorInstrumentsRecording', () => {
  const temporaryRecordingPath = 'SomeTemporaryRecordingPath';
  const artifactPath = 'SomeArtifactPath';

  let recording;

  beforeEach(() => {
    recording = new SimulatorInstrumentsRecording({
      temporaryRecordingPath
    });
  });

  it('should prepare sampling interval', () => {
    expect(recording.prepareSamplingInterval(100500)).toBe(100.5);
  });

  it('should move artifact to temporary path', async () => {
    FileArtifact.moveTemporaryFile.mockReturnValueOnce(true);
    await recording.doSave(artifactPath);
    expect(FileArtifact.moveTemporaryFile).toBeCalledWith(expect.anything(), temporaryRecordingPath, artifactPath);
  });

  it('should not warn console on moving artifact success', async () => {
    FileArtifact.moveTemporaryFile.mockReturnValueOnce(true);
    await recording.doSave(artifactPath);
    expect(log.warn).not.toBeCalled();
  });

  it('should warn console only on moving artifact failure', async () => {
    FileArtifact.moveTemporaryFile.mockReturnValueOnce(false);
    await recording.doSave(artifactPath);
    expect(log.warn).toBeCalled();
  });

  it('should remove artifact on discard', async () => {
    await recording.doDiscard(artifactPath);
    expect(fs.remove).toBeCalledWith(temporaryRecordingPath);
  });
});
