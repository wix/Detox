// @ts-nocheck
const InstrumentsArtifactRecording = require('./InstrumentsArtifactRecording');

describe('InstrumentsArtifactRecording', () => {
  let mockedClient, mockedPluginContext;

  beforeEach(() => {
    mockedClient = {
      startInstrumentsRecording: jest.fn(),
      stopInstrumentsRecording: jest.fn()
    };
  });

  describe('isClientConnected', () => {
    it('should be connected with real connection', () => {
      const recording = new InstrumentsArtifactRecording({
        pluginContext: mockedPluginContext,
        client: mockedClient,
      });
      mockedClient.isConnected = true;
      expect(recording._isClientConnected()).toBe(true);
    });

    it('should be disconnected without real connection', () => {
      const recording = new InstrumentsArtifactRecording({
        pluginContext: mockedPluginContext,
        client: mockedClient,
      });
      mockedClient.isConnected = false;
      expect(recording._isClientConnected()).toBe(false);
    });
  });

  it('should not start instruments recording as client not connected', async () => {
    const recording = new InstrumentsArtifactRecording({
      pluginContext: mockedPluginContext,
      client: mockedClient,
      userConfig: {
        enabled: true
      },
      temporaryRecordingPath: 'SomeRecordingPath'
    });
    mockedClient.isConnected = false;
    await recording.doStart();
    expect(mockedClient.startInstrumentsRecording).not.toBeCalled();
  });

  it('should not start instruments recording with connected client and DRY', async () => {
    const recording = new InstrumentsArtifactRecording({
      pluginContext: mockedPluginContext,
      client: mockedClient,
      userConfig: {
        enabled: true
      },
      temporaryRecordingPath: 'SomeRecordingPath'
    });
    mockedClient.isConnected = true;
    await recording.doStart({ dry: true });
    expect(mockedClient.startInstrumentsRecording).not.toBeCalled();
  });

  it('should start instruments recording with empty user config', async () => {
    const recording = new InstrumentsArtifactRecording({
      pluginContext: mockedPluginContext,
      client: mockedClient,
      userConfig: {
        enabled: true
      },
      temporaryRecordingPath: 'SomeRecordingPath'
    });
    mockedClient.isConnected = true;
    await recording.doStart();
    expect(mockedClient.startInstrumentsRecording).toBeCalledWith({
      recordingPath: 'SomeRecordingPath'
    });
  });

  it('should start instruments recording with sampling interval', async () => {
    const recording = new InstrumentsArtifactRecording({
      pluginContext: mockedPluginContext,
      client: mockedClient,
      userConfig: {
        enabled: true,
        samplingInterval: 100500
      },
      temporaryRecordingPath: 'SomeRecordingPath'
    });
    mockedClient.isConnected = true;
    await recording.doStart();
    expect(mockedClient.startInstrumentsRecording).toBeCalledWith({
      recordingPath: 'SomeRecordingPath',
      samplingInterval: 100500
    });
  });

  it('should not stop instruments recording with disconnected client', async () => {
    const recording = new InstrumentsArtifactRecording({
      pluginContext: mockedPluginContext,
      client: mockedClient
    });
    mockedClient.isConnected = false;
    await recording.doStop();
    expect(mockedClient.stopInstrumentsRecording).not.toBeCalled();
  });

  it('should stop instruments recording with connected client', async () => {
    const recording = new InstrumentsArtifactRecording({
      pluginContext: mockedPluginContext,
      client: mockedClient
    });
    mockedClient.isConnected = true;
    await recording.doStop();
    expect(mockedClient.stopInstrumentsRecording).toBeCalled();
  });
});
