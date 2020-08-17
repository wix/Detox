const path = require('path');
const fs = require('fs');
const DeviceDriverBase = require('../DeviceDriverBase');
const AppleSimUtils = require('./tools/AppleSimUtils');

const SimulatorLogPlugin = require('../../../artifacts/log/ios/SimulatorLogPlugin');
const SimulatorScreenshotPlugin = require('../../../artifacts/screenshot/SimulatorScreenshotPlugin');
const SimulatorRecordVideoPlugin = require('../../../artifacts/video/SimulatorRecordVideoPlugin');
const SimulatorInstrumentsPlugin = require('../../../artifacts/instruments/ios/SimulatorInstrumentsPlugin');
const TimelineArtifactPlugin = require('../../../artifacts/timeline/TimelineArtifactPlugin');
const IosUIHierarchyPlugin = require('../../../artifacts/uiHierarchy/IosUIHierarchyPlugin');

class IosDriver extends DeviceDriverBase {
  constructor(config) {
    super(config);

    this.applesimutils = new AppleSimUtils();
  }

  declareArtifactPlugins() {
    const appleSimUtils = this.applesimutils;
    const client = this.client;

    return {
      instruments: (api) => new SimulatorInstrumentsPlugin({ api, client }),
      log: (api) => new SimulatorLogPlugin({ api, appleSimUtils }),
      screenshot: (api) => new SimulatorScreenshotPlugin({ api, appleSimUtils }),
      video: (api) => new SimulatorRecordVideoPlugin({ api, appleSimUtils }),
      timeline: (api) => new TimelineArtifactPlugin({api, appleSimUtils}),
      uiHierarchy: (api) => new IosUIHierarchyPlugin({ api, client }),
    };
  }

  createPayloadFile(notification) {
    const notificationFilePath = path.join(this.createRandomDirectory(), `payload.json`);
    fs.writeFileSync(notificationFilePath, JSON.stringify(notification, null, 2));
    return notificationFilePath;
  }

  async setURLBlacklist(blacklistURLs) {
    return await this.client.setSyncSettings({blacklistURLs: blacklistURLs});
  }

  async enableSynchronization() {
    return await this.client.setSyncSettings({enabled: true});
  }

  async disableSynchronization() {
    return await this.client.setSyncSettings({enabled: false});
  }

  async shake(deviceId) {
    return await this.client.shake();
  }

  async setOrientation(deviceId, orientation) {
    if (!['portrait', 'landscape'].some(option => option === orientation)) throw new Error("orientation should be either 'portrait' or 'landscape', but got " + (orientation + ")"));
    return await this.client.setOrientation({orientation});
  }

  validateDeviceConfig(config) {
    //no validation
  }

  getPlatform() {
    return 'ios';
  }
}

module.exports = IosDriver;
