describe('Artifacts manager factory', () => {
  const config = {
    mock: 'config',
  };
  const eventEmitter = {
    mock: 'emitter',
  };
  const runtimeDriver = {
    mock: 'runtimeDriver',
  };

  const givenArtifactPlugins = (plugins) => pluginsProvider.declareArtifactPlugins.mockReturnValue(plugins);

  let ArtifactsManager;
  let pluginsProvider;
  let factory;
  beforeEach(() => {
    jest.mock('../ArtifactsManager');
    ArtifactsManager = require('../ArtifactsManager');

    const PluginsProvider = jest.genMockFromModule('../providers').EmptyProvider;
    pluginsProvider = new PluginsProvider();

    const { ArtifactsManagerFactory } = require('./index');
    factory = new ArtifactsManagerFactory(pluginsProvider);
  });

  it('should create an artifacts manager', () => {
    const artifactsManager = factory.createArtifactsManager(config, { eventEmitter, runtimeDriver });
    expect(artifactsManager).toBeDefined();
    expect(ArtifactsManager).toHaveBeenCalledWith(config);
  });

  it('should subscribe artifacts manager to device events', () => {
    const artifactsManager = factory.createArtifactsManager(config, { eventEmitter, runtimeDriver });
    expect(artifactsManager.subscribeToDeviceEvents).toHaveBeenCalledWith(eventEmitter);
  });

  it('should register plugins in the artifacts manager', () => {
    const plugins = {
      'fakePlugin': {},
    };
    givenArtifactPlugins(plugins);

    const artifactsManager = factory.createArtifactsManager(config, { eventEmitter, runtimeDriver });
    expect(artifactsManager.registerArtifactPlugins).toHaveBeenCalledWith(plugins);
    expect(pluginsProvider.declareArtifactPlugins).toHaveBeenCalledWith({ runtimeDriver });
  });
});
