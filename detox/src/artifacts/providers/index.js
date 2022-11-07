class ArtifactPluginsProvider {
  declareArtifactPlugins() {}
}

class AndroidArtifactPluginsProvider extends ArtifactPluginsProvider {
  /** @override */
  declareArtifactPlugins() {
    const serviceLocator = require('../../servicelocator/android');
    const adb = serviceLocator.adb;
    const devicePathBuilder = serviceLocator.devicePathBuilder;

    const AndroidInstrumentsPlugin = require('../instruments/android/AndroidInstrumentsPlugin');
    const ADBLogcatPlugin = require('../log/android/ADBLogcatPlugin');
    const ADBScreencapPlugin = require('../screenshot/ADBScreencapPlugin');
    const ADBScreenrecorderPlugin = require('../video/ADBScreenrecorderPlugin');
    const TimelineArtifactPlugin = require('../timeline/TimelineArtifactPlugin');

    return {
      instruments: (api) => new AndroidInstrumentsPlugin({ api, adb, devicePathBuilder }),
      log: (api) => new ADBLogcatPlugin({ api, adb, devicePathBuilder }),
      screenshot: (api) => new ADBScreencapPlugin({ api, adb, devicePathBuilder }),
      video: (api) => new ADBScreenrecorderPlugin({ api, adb, devicePathBuilder }),
      timeline: (api) => new TimelineArtifactPlugin({ api }),
    };
  }
}

class IosArtifactPluginsProvider extends ArtifactPluginsProvider {
  /** @override */
  declareArtifactPlugins() {
    const TimelineArtifactPlugin = require('../timeline/TimelineArtifactPlugin');
    const IosUIHierarchyPlugin = require('../uiHierarchy/IosUIHierarchyPlugin');

    return {
      timeline: (api) => new TimelineArtifactPlugin({ api }),
      uiHierarchy: (api) => new IosUIHierarchyPlugin({ api }),
    };
  }
}

class IosSimulatorArtifactPluginsProvider extends IosArtifactPluginsProvider {
  /** @override */
  declareArtifactPlugins() {
    const serviceLocator = require('../../servicelocator/ios');
    const appleSimUtils = serviceLocator.appleSimUtils;

    const SimulatorInstrumentsPlugin = require('../instruments/ios/SimulatorInstrumentsPlugin');
    const SimulatorLogPlugin = require('../log/ios/SimulatorLogPlugin');
    const SimulatorScreenshotPlugin = require('../screenshot/SimulatorScreenshotPlugin');
    const SimulatorRecordVideoPlugin = require('../video/SimulatorRecordVideoPlugin');

    return {
      ...super.declareArtifactPlugins(),

      log: (api) => new SimulatorLogPlugin({ api, appleSimUtils }),
      screenshot: (api) => new SimulatorScreenshotPlugin({ api, appleSimUtils }),
      video: (api) => new SimulatorRecordVideoPlugin({ api, appleSimUtils }),
      instruments: (api) => new SimulatorInstrumentsPlugin({ api }),
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
