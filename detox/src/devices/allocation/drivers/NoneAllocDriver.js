const { AllocationDriverBase, DeallocationDriverBase } = require('./AllocationDriverBase');

class NoneAllocDriver extends AllocationDriverBase {
  async allocate(deviceQuery) {
    return null;
  }
}

class NoneDeallocDriver extends DeallocationDriverBase {
  async free(options) {}
}

module.exports = {
  NoneAllocDriver,
  NoneDeallocDriver,
};
