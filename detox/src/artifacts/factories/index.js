const ArtifactsManager = require('../ArtifactsManager');
const {
  AndroidArtifactPluginsProvider,
  IosArtifactPluginsProvider,
  IosSimulatorArtifactPluginsProvider,
  EmptyProvider,
} = require('../providers');

class ArtifactsManagerFactory {
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

class Android extends ArtifactsManagerFactory {
  constructor() {
    super(new AndroidArtifactPluginsProvider());
  }
}

class Ios extends ArtifactsManagerFactory {
  constructor() {
    super(new IosArtifactPluginsProvider());
  }
}

class IosSimulator extends ArtifactsManagerFactory {
  constructor() {
    super(new IosSimulatorArtifactPluginsProvider());
  }
}

class External extends ArtifactsManagerFactory {
  constructor(module) {
    super(new (module.ArtifactPluginsProviderClass || EmptyProvider)());
  }
}

module.exports = {
  ArtifactsManagerFactory,
  Android,
  Ios,
  IosSimulator,
  External,
};
