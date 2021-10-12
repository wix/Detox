const DeviceAllocatorFactory = require('./base');

class None extends DeviceAllocatorFactory {
  _createDriver() {
    const { NoneAllocDriver, NoneDeallocDriver } = require('../drivers/NoneAllocDriver');
    return {
      allocDriver: new NoneAllocDriver(),
      createDeallocDriver: () => new NoneDeallocDriver(),
    };
  }
}

module.exports = { None };
