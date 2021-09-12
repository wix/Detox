const ArtifactsManager = require('../ArtifactsManager');
const {
  AndroidArtifactPluginsProvider,
  IosArtifactPluginsProvider,
  IosSimulatorArtifactPluginsProvider,
  EmptyProvider,
} = require('./providers');

class ArtifactsManagerFactoryBase {
  /**
   * @param provider { ArtifactPluginsProvider }
   */
  constructor(provider) {
    this._provider = provider;
  }

  createArtifactsManager(artifactsConfig, { eventEmitter, client }) {
    const artifactsManager = new ArtifactsManager(artifactsConfig);
    artifactsManager.subscribeToDeviceEvents(eventEmitter);
    artifactsManager.registerArtifactPlugins(this._provider.declareArtifactPlugins({ client }));
    return artifactsManager;
  }
}

class AndroidFactory extends ArtifactsManagerFactoryBase {
  constructor() {
    super(new AndroidArtifactPluginsProvider());
  }
}

class IosFactory extends ArtifactsManagerFactoryBase {
  constructor() {
    super(new IosArtifactPluginsProvider());
  }
}

class IosSimulatorFactory extends ArtifactsManagerFactoryBase {
  constructor() {
    super(new IosSimulatorArtifactPluginsProvider());
  }
}

class ExternalFactory extends ArtifactsManagerFactoryBase {
  constructor(module) {
    super(new (module.ArtifactPluginsProviderClass || EmptyProvider)());
  }
}

module.exports = {
  AndroidFactory,
  IosFactory,
  IosSimulatorFactory,
  ExternalFactory,
};
