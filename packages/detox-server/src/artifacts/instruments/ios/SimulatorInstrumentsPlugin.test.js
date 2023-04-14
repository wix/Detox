// @ts-nocheck
const temporaryPath = require('../../utils/temporaryPath');

const SimulatorInstrumentsPlugin = require('./SimulatorInstrumentsPlugin');

jest.mock('../../utils/temporaryPath');

describe('SimulatorInstrumentsPlugin', () => {
  const testSummary = 'TestSummary';
  const testPath = 'TestPath';

  let pluginConfig;

  beforeEach(() => {
    const mockedApi = {
      trackArtifact: jest.fn(),
      untrackArtifact: jest.fn()
    };
    const mockedClient = {
      isConnected: true,
      startInstrumentsRecording: jest.fn(),
    };
    pluginConfig = {
      api: {
        ...mockedApi,
        userConfig: {
          enabled: true
        }
      },
      client: mockedClient
    };
    temporaryPath.for.dtxrec.mockReturnValueOnce(testPath);
  });

  it('should not build launchArgs without started test', async () => {
    const plugin = new SimulatorInstrumentsPlugin(pluginConfig);
    const event = {
      launchArgs: {}
    };
    await plugin.onBeforeLaunchApp(event);
    expect(event.launchArgs.recordingPath).toBeUndefined();
  });

  it('should build launchArgs with empty config', async () => {
    const plugin = new SimulatorInstrumentsPlugin(pluginConfig);
    const event = {
      launchArgs: {}
    };
    await plugin.onTestStart(testSummary);
    await plugin.onBeforeLaunchApp(event);
    expect(event.launchArgs.recordingPath).toBe(testPath);
    expect(event.launchArgs.samplingInterval).toBe(0.25);
    expect(event.launchArgs.instrumentsPath).toBeUndefined();
  });

  it('should build launchArgs with samplingInterval from config', async () => {
    pluginConfig.api.userConfig.samplingInterval = 100500;

    const plugin = new SimulatorInstrumentsPlugin(pluginConfig);
    const event = {
      launchArgs: {}
    };
    await plugin.onTestStart(testSummary);
    await plugin.onBeforeLaunchApp(event);
    expect(event.launchArgs.samplingInterval).toBe(100.5);
  });

  it('should build launchArgs with instrumentsPath from ENV', async () => {
    const plugin = new SimulatorInstrumentsPlugin(pluginConfig);
    const event = {
      launchArgs: {}
    };
    await plugin.onTestStart(testSummary);
    const detoxInstrumentsPath = '/DETOX/INSTRUMENTS/PATH';
    process.env.DETOX_INSTRUMENTS_PATH = detoxInstrumentsPath;
    await plugin.onBeforeLaunchApp(event);
    delete process.env.DETOX_INSTRUMENTS_PATH;
    expect(event.launchArgs.instrumentsPath).toBe(detoxInstrumentsPath);
  });

  it('should prepare path for artifact ', async () => {
    const preparePathForArtifact = jest.fn();
    pluginConfig.api.preparePathForArtifact = preparePathForArtifact;

    const plugin = new SimulatorInstrumentsPlugin(pluginConfig);
    preparePathForArtifact.mockReturnValueOnce(testPath);
    const path = await plugin.preparePathForTestArtifact(testSummary);
    expect(preparePathForArtifact).toBeCalledWith('test.dtxrec', testSummary);
    expect(path).toBe(testPath);
  });
});
