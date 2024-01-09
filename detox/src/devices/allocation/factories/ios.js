// @ts-nocheck
const DeviceAllocatorFactory = require('./base');

class IosSimulator extends DeviceAllocatorFactory {
  _createDriver({ detoxConfig, detoxSession }) {
    const AppleSimUtils = require('../../../devices/common/drivers/ios/tools/AppleSimUtils');
    const applesimutils = new AppleSimUtils();

    const DeviceRegistry = require('../../../devices/allocation/DeviceRegistry');
    const deviceRegistry = new DeviceRegistry({ sessionId: detoxSession.id });

    const SimulatorAllocDriver = require('../drivers/ios/SimulatorAllocDriver');
    return new SimulatorAllocDriver({ detoxConfig, deviceRegistry, applesimutils });
  }
}

module.exports = { IosSimulator };
