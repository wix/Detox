const AllocationDriverFactory = require('./AllocationDriverFactory');
const {
  NoneAllocDriver,
  NoneDeallocDriver,
} = require('../../drivers/NoneAllocDriver');

class NoneAllocDriverFactory extends AllocationDriverFactory {
  createAllocationDriver(deps) {
    return {
      allocDriver: new NoneAllocDriver(),
      createDeallocDriver: () => new NoneDeallocDriver(),
    }
  }
}

module.exports = NoneAllocDriverFactory;
