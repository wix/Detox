const {
  NoneAllocDriver,
  NoneDeallocDriver,
} = require('../../drivers/NoneAllocDriver');

const AllocationDriverFactory = require('./AllocationDriverFactory');

class NoneAllocDriverFactory extends AllocationDriverFactory {
  createAllocationDriver() {
    return {
      allocDriver: new NoneAllocDriver(),
      createDeallocDriver: () => new NoneDeallocDriver(),
    };
  }
}

module.exports = NoneAllocDriverFactory;
