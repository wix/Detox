// @ts-nocheck
const DeviceAllocatorFactory = require('./base');

class Noop extends DeviceAllocatorFactory {
    _createDriver() {
      const AllocationDriverBase = require('../drivers/AllocationDriverBase');
      return new AllocationDriverBase();
    }
}
  
module.exports = {
  Noop
};