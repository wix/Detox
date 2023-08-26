// @ts-nocheck
const DeviceAllocatorFactory = require('./base');

class IosSimulator extends DeviceAllocatorFactory {
  _createDriver({ detoxConfig, detoxSession, eventEmitter }) {
    const AppleSimUtils = require('../../../devices/common/drivers/ios/tools/AppleSimUtils');
    const applesimutils = new AppleSimUtils();

    const DeviceRegistry = require('../../../devices/allocation/DeviceRegistry');
    const deviceRegistry = new DeviceRegistry({ sessionId: detoxSession.sessionId });

    const SimulatorLauncher = require('../drivers/ios/SimulatorLauncher');
    const simulatorLauncher = new SimulatorLauncher({ applesimutils, eventEmitter });

    const SimulatorAllocDriver = require('../drivers/ios/SimulatorAllocDriver');
    return new SimulatorAllocDriver({ detoxConfig, deviceRegistry, applesimutils, simulatorLauncher });
  }
}

module.exports = { IosSimulator };
