const ArtifactsManager = require('../ArtifactsManager');

const {
  AndroidArtifactPluginsProvider,
  IosArtifactPluginsProvider,
  IosSimulatorArtifactPluginsProvider,
  EmptyProvider,
} = require('./providers');

class ArtifactsManagerFactory {
  /**
   * @param provider { ArtifactPluginsProviderBase }
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

class AndroidFactory extends ArtifactsManagerFactory {
  constructor() {
    super(new AndroidArtifactPluginsProvider());
  }
}

class IosFactory extends ArtifactsManagerFactory {
  constructor() {
    super(new IosArtifactPluginsProvider());
  }
}

class IosSimulatorFactory extends ArtifactsManagerFactory {
  constructor() {
    super(new IosSimulatorArtifactPluginsProvider());
  }
}

class ExternalFactory extends ArtifactsManagerFactory {
  constructor(module) {
    super(new (module.ArtifactPluginsProviderClass || EmptyProvider)());
  }
}

module.exports = {
  ArtifactsManagerFactory,
  AndroidFactory,
  IosFactory,
  IosSimulatorFactory,
  ExternalFactory,
};
