// @ts-nocheck
const DetoxRuntimeError = require('../../../errors/DetoxRuntimeError');

const DeviceAllocatorFactory = require('./base');

class External extends DeviceAllocatorFactory {
  static validateModule(module, path) {
    if (!module.DeviceAllocationDriverClass) {
      throw new DetoxRuntimeError(`The custom driver at '${path}' does not export the DeviceAllocationDriverClass property`);
    }
  }

  constructor(module, path) {
    super();
    External.validateModule(module, path);

    this._module = module;
  }

  _createDriver(deps) {
    return new this._module.DeviceAllocationDriverClass(deps);
  }
}

module.exports = { External };
