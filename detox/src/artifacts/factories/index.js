const ArtifactsManager = require('../ArtifactsManager');

class ArtifactsManagerFactory {
  createArtifactsManager(artifactsConfig, { eventEmitter, client }) {
    const artifactsManager = new ArtifactsManager(artifactsConfig);
    artifactsManager.subscribeToDeviceEvents(eventEmitter);
    artifactsManager.registerArtifactPlugins(this._declareArtifactPlugins({ client }));
    return artifactsManager;
  }

  /**
   * @private
   */
  _declareArtifactPlugins() {}
}

class AndroidArtifactsManagerFactory extends ArtifactsManagerFactory {
  _declareArtifactPlugins({ client }) {
    const ADB = require('../../devices/common/drivers/android/exec/ADB');
    const AndroidDevicePathBuilder = require('../utils/AndroidDevicePathBuilder');

    const AndroidInstrumentsPlugin = require('../instruments/android/AndroidInstrumentsPlugin');
    const ADBLogcatPlugin = require('../log/android/ADBLogcatPlugin');
    const ADBScreencapPlugin = require('../screenshot/ADBScreencapPlugin');
    const ADBScreenrecorderPlugin = require('../video/ADBScreenrecorderPlugin');
    const TimelineArtifactPlugin = require('../timeline/TimelineArtifactPlugin');

    const adb = new ADB();
    const devicePathBuilder = new AndroidDevicePathBuilder();
    return {
      instruments: (api) => new AndroidInstrumentsPlugin({ api, adb, client, devicePathBuilder }),
      log: (api) => new ADBLogcatPlugin({ api, adb, devicePathBuilder }),
      screenshot: (api) => new ADBScreencapPlugin({ api, adb, devicePathBuilder }),
      video: (api) => new ADBScreenrecorderPlugin({ api, adb, devicePathBuilder }),
      timeline: (api) => new TimelineArtifactPlugin({ api }),
    };
  }
}

class IosArtifactsManagerFactory extends ArtifactsManagerFactory {
  _declareArtifactPlugins({ client }) {
    const TimelineArtifactPlugin = require('../timeline/TimelineArtifactPlugin');
    const IosUIHierarchyPlugin = require('../uiHierarchy/IosUIHierarchyPlugin');

    return {
      timeline: (api) => new TimelineArtifactPlugin({ api }),
      uiHierarchy: (api) => new IosUIHierarchyPlugin({ api, client }),
    };
  }
}

class IosSimulatorArtifactsManagerFactory extends IosArtifactsManagerFactory {
  _declareArtifactPlugins({ client }) {
    const AppleSimUtils = require('../../devices/common/drivers/ios/tools/AppleSimUtils');
    const SimulatorInstrumentsPlugin = require('../instruments/ios/SimulatorInstrumentsPlugin');
    const SimulatorLogPlugin = require('../log/ios/SimulatorLogPlugin');
    const SimulatorScreenshotPlugin = require('../screenshot/SimulatorScreenshotPlugin');
    const SimulatorRecordVideoPlugin = require('../video/SimulatorRecordVideoPlugin');

    const appleSimUtils = new AppleSimUtils();
    return {
      ...super._declareArtifactPlugins({ client }),

      log: (api) => new SimulatorLogPlugin({ api, appleSimUtils }),
      screenshot: (api) => new SimulatorScreenshotPlugin({ api, appleSimUtils, client }),
      video: (api) => new SimulatorRecordVideoPlugin({ api, appleSimUtils }),
      instruments: (api) => new SimulatorInstrumentsPlugin({ api, client }),
    };
  }
}

module.exports = {
  AndroidArtifactsManagerFactory,
  IosArtifactsManagerFactory,
  IosSimulatorArtifactsManagerFactory,
};
