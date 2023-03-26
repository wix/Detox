class ArtifactPluginsProvider {
  declareArtifactPlugins({ client }) {} // eslint-disable-line no-unused-vars
}

class AndroidArtifactPluginsProvider extends ArtifactPluginsProvider {
  declareArtifactPlugins({ client }) {
    const serviceLocator = require('../../servicelocator/android');
    const adb = serviceLocator.adb;
    const devicePathBuilder = serviceLocator.devicePathBuilder;

    const AndroidInstrumentsPlugin = require('../instruments/android/AndroidInstrumentsPlugin');
    const ADBLogcatPlugin = require('../log/android/ADBLogcatPlugin');
    const ADBScreencapPlugin = require('../screenshot/ADBScreencapPlugin');
    const ADBScreenrecorderPlugin = require('../video/ADBScreenrecorderPlugin');

    return {
      instruments: (api) => new AndroidInstrumentsPlugin({ api, adb, client, devicePathBuilder }),
      log: (api) => new ADBLogcatPlugin({ api, adb, devicePathBuilder }),
      screenshot: (api) => new ADBScreencapPlugin({ api, adb, devicePathBuilder }),
      video: (api) => new ADBScreenrecorderPlugin({ api, adb, devicePathBuilder }),
    };
  }
}

class IosArtifactPluginsProvider extends ArtifactPluginsProvider {
  declareArtifactPlugins({ client }) {
    const IosUIHierarchyPlugin = require('../uiHierarchy/IosUIHierarchyPlugin');

    return {
      uiHierarchy: (api) => new IosUIHierarchyPlugin({ api, client }),
    };
  }
}

class IosSimulatorArtifactPluginsProvider extends IosArtifactPluginsProvider {
  declareArtifactPlugins({ client }) {
    return {};
  }
}

class EmptyProvider extends ArtifactPluginsProvider {
  constructor() {
    super();
    this.declareArtifactPlugins = () => ({});
  }
}

module.exports = {
  AndroidArtifactPluginsProvider,
  IosArtifactPluginsProvider,
  IosSimulatorArtifactPluginsProvider,
  EmptyProvider,
};
