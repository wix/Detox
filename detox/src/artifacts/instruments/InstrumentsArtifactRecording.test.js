// @ts-nocheck
const InstrumentsArtifactRecording = require('./InstrumentsArtifactRecording');

describe('InstrumentsArtifactRecording', () => {
  let mockRuntimeDriver, mockedPluginContext;

  beforeEach(() => {
    mockRuntimeDriver = {
      startInstrumentsRecording: jest.fn(),
      stopInstrumentsRecording: jest.fn()
    };
  });

  it('should not start instruments recording with DRY', async () => {
    const recording = new InstrumentsArtifactRecording({
      pluginContext: mockedPluginContext,
      runtimeDriver: mockRuntimeDriver,
      userConfig: {
        enabled: true
      },
      temporaryRecordingPath: 'SomeRecordingPath'
    });
    await recording.doStart({ dry: true });
    expect(mockRuntimeDriver.startInstrumentsRecording).not.toBeCalled();
  });

  it('should start instruments recording with empty user config', async () => {
    const recording = new InstrumentsArtifactRecording({
      pluginContext: mockedPluginContext,
      runtimeDriver: mockRuntimeDriver,
      userConfig: {
        enabled: true
      },
      temporaryRecordingPath: 'SomeRecordingPath'
    });
    await recording.doStart();
    expect(mockRuntimeDriver.startInstrumentsRecording).toBeCalledWith({
      recordingPath: 'SomeRecordingPath'
    });
  });

  it('should start instruments recording with sampling interval', async () => {
    const recording = new InstrumentsArtifactRecording({
      pluginContext: mockedPluginContext,
      runtimeDriver: mockRuntimeDriver,
      userConfig: {
        enabled: true,
        samplingInterval: 100500
      },
      temporaryRecordingPath: 'SomeRecordingPath'
    });
    await recording.doStart();
    expect(mockRuntimeDriver.startInstrumentsRecording).toBeCalledWith({
      recordingPath: 'SomeRecordingPath',
      samplingInterval: 100500
    });
  });

  it('should stop instruments recording', async () => {
    const recording = new InstrumentsArtifactRecording({
      pluginContext: mockedPluginContext,
      runtimeDriver: mockRuntimeDriver
    });
    await recording.doStop();
    expect(mockRuntimeDriver.stopInstrumentsRecording).toBeCalled();
  });
});
