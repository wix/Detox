const AndroidInstrumentsPlugin = require('./AndroidInstrumentsPlugin');

describe('AndroidInstrumentsPlugin', () => {
  const testSummary = 'SomeTestSummary';
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
    const mockedDevicePathBuilder = {
      buildTemporaryArtifactPath: () => {
        return 'test123';
      }
    };
    pluginConfig = {
      api: {
        ...mockedApi,
        userConfig: {
          enabled: true
        }
      },
      client: mockedClient,
      devicePathBuilder: mockedDevicePathBuilder
    };
  });

  it('should not build launchArgs without started test', async () => {
    const plugin = new AndroidInstrumentsPlugin(pluginConfig);
    const event = {
      launchArgs: {}
    };
    await plugin.onBeforeLaunchApp(event);
    expect(event.launchArgs).toEqual({});
  });

  it('should build launchArgs with started test and empty config', async () => {
    const plugin = new AndroidInstrumentsPlugin(pluginConfig);
    const event = {
      launchArgs: {}
    };
    await plugin.onTestStart(testSummary);
    await plugin.onBeforeLaunchApp(event);
    expect(event.launchArgs.detoxInstrumRecPath).toBe(pluginConfig.devicePathBuilder.buildTemporaryArtifactPath());
    expect(event.launchArgs.detoxInstrumSamplingInterval).toBeUndefined();
  });

  it('should build launchArgs with started test and samplingInterval from config', async () => {
    pluginConfig.api.userConfig.samplingInterval = 100500;

    const plugin = new AndroidInstrumentsPlugin(pluginConfig);
    const event = {
      launchArgs: {}
    };
    await plugin.onTestStart(testSummary);
    await plugin.onBeforeLaunchApp(event);
    expect(event.launchArgs.detoxInstrumSamplingInterval).toBe(100500);
  });

  it('should prepare path for artifact ', async () => {
    const preparedPath = 'SomePreparedPath';
    const preparePathForArtifact = jest.fn();
    pluginConfig.api.preparePathForArtifact = preparePathForArtifact;
    preparePathForArtifact.mockReturnValueOnce(preparedPath);

    const plugin = new AndroidInstrumentsPlugin(pluginConfig);
    const path = await plugin.preparePathForTestArtifact(testSummary);
    expect(preparePathForArtifact).toBeCalledWith('test.dtxplain', testSummary);
    expect(path).toBe(preparedPath);
  });
});
