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
    const TimelineArtifactPlugin = require('../timeline/TimelineArtifactPlugin');

    return {
      instruments: (api) => new AndroidInstrumentsPlugin({ api, adb, client, devicePathBuilder }),
      log: (api) => new ADBLogcatPlugin({ api, adb, devicePathBuilder }),
      screenshot: (api) => new ADBScreencapPlugin({ api, adb, devicePathBuilder }),
      video: (api) => new ADBScreenrecorderPlugin({ api, adb, devicePathBuilder }),
      timeline: (api) => new TimelineArtifactPlugin({ api }),
    };
  }
}

class IosArtifactPluginsProvider extends ArtifactPluginsProvider {
  declareArtifactPlugins({ client }) {
    const TimelineArtifactPlugin = require('../timeline/TimelineArtifactPlugin');
    const IosUIHierarchyPlugin = require('../uiHierarchy/IosUIHierarchyPlugin');

    return {
      timeline: (api) => new TimelineArtifactPlugin({ api }),
      uiHierarchy: (api) => new IosUIHierarchyPlugin({ api, client }),
    };
  }
}

class IosSimulatorArtifactPluginsProvider extends IosArtifactPluginsProvider {
  declareArtifactPlugins({ client }) {
    const serviceLocator = require('../../servicelocator/ios');
    const appleSimUtils = serviceLocator.appleSimUtils;

    const SimulatorInstrumentsPlugin = require('../instruments/ios/SimulatorInstrumentsPlugin');
    const SimulatorLogPlugin = require('../log/ios/SimulatorLogPlugin');
    const SimulatorScreenshotPlugin = require('../screenshot/SimulatorScreenshotPlugin');
    const SimulatorRecordVideoPlugin = require('../video/SimulatorRecordVideoPlugin');

    return {
      ...super.declareArtifactPlugins({ client }),

      log: (api) => new SimulatorLogPlugin({ api, appleSimUtils }),
      screenshot: (api) => new SimulatorScreenshotPlugin({ api, appleSimUtils, client }),
      video: (api) => new SimulatorRecordVideoPlugin({ api, appleSimUtils }),
      instruments: (api) => new SimulatorInstrumentsPlugin({ api, client }),
    };
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
