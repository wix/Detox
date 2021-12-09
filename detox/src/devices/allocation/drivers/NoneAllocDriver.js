const AllocationDriverBase = require('./AllocationDriverBase');

class NoneAllocDriver extends AllocationDriverBase {
  async allocate(deviceQuery) { // eslint-disable-line no-unused-vars
    return null;
  }
  async free(cookie, options) {} // eslint-disable-line no-unused-vars
}

module.exports = NoneAllocDriver;
