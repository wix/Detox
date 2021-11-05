const DeviceAllocatorFactory = require('./base');

class None extends DeviceAllocatorFactory {
  _createDriver() {
    const NoneAllocDriver = require('../drivers/NoneAllocDriver');
    return new NoneAllocDriver();
  }
}

module.exports = { None };
