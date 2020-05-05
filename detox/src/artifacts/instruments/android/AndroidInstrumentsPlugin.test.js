const AndroidInstrumentsPlugin = require('./AndroidInstrumentsPlugin');

describe('AndroidInstrumentsPlugin', () => {
  const testSummary = 'SomeTestSummary';
  let mockedApi, mockedClient, mockedDevicePathBuilder;

  beforeEach(() => {
    mockedApi = {
      trackArtifact: jest.fn(),
      untrackArtifact: jest.fn()
    };
    mockedClient = {
      isConnected: true,
      pandingAppCrash: false
    };
    mockedDevicePathBuilder = {
      buildTemporaryArtifactPath: () => {
        return 'test123';
      }
    };
  });

  it('should not build launchArgs without started test', async () => {
    const plugin = new AndroidInstrumentsPlugin({
      api: {
        ...mockedApi,
        userConfig: {
          enabled: true
        }
      },
      client: mockedClient,
      devicePathBuilder: mockedDevicePathBuilder
    });

    const event = {
      launchArgs: {}
    };
    await plugin.onBeforeLaunchApp(event);
    expect(event.launchArgs).toEqual({});
  });

  it('should build launchArgs with started test and empty config', async () => {
    const plugin = new AndroidInstrumentsPlugin({
      api: {
        ...mockedApi,
        userConfig: {
          enabled: true
        }
      },
      client: mockedClient,
      devicePathBuilder: mockedDevicePathBuilder
    });

    const event = {
      launchArgs: {}
    };
    await plugin.onTestStart(testSummary);
    await plugin.onBeforeLaunchApp(event);
    expect(event.launchArgs.detoxInstrumRecPath).toBe(mockedDevicePathBuilder.buildTemporaryArtifactPath());
    expect(event.launchArgs.detoxInstrumSamplingInterval).toBeUndefined();
  });

  it('should build launchArgs with started test and samplingInterval from config', async () => {
    const plugin = new AndroidInstrumentsPlugin({
      api: {
        ...mockedApi,
        userConfig: {
          enabled: true,
          samplingInterval: 100500
        }
      },
      client: mockedClient,
      devicePathBuilder: mockedDevicePathBuilder
    });

    const event = {
      launchArgs: {}
    };
    await plugin.onTestStart(testSummary);
    await plugin.onBeforeLaunchApp(event);
    expect(event.launchArgs.detoxInstrumSamplingInterval).toBe(100500);
  });

  it('should prepare path for artifact ', async () => {
    const preparePathForArtifact = jest.fn();
    const plugin = new AndroidInstrumentsPlugin({
      api: {
        preparePathForArtifact,
        userConfig: {
          enabled: true
        }
      }
    });
    const preparedPath = 'SomePreparedPath';
    preparePathForArtifact.mockReturnValueOnce(preparedPath);
    const path = await plugin.preparePathForTestArtifact(testSummary);
    expect(preparePathForArtifact).toBeCalledWith('test.dtxplain', testSummary);
    expect(path).toBe(preparedPath);
  });
});
