const { AllocationDriverBase, DeallocationDriverBase } = require('./AllocationDriverBase');

class NoneAllocDriver extends AllocationDriverBase {
  async allocate(deviceQuery) { // eslint-disable-line no-unused-vars
    return null;
  }
}

class NoneDeallocDriver extends DeallocationDriverBase {
  async free(options) {} // eslint-disable-line no-unused-vars
}

module.exports = {
  NoneAllocDriver,
  NoneDeallocDriver,
};
