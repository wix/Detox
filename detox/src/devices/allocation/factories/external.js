const DetoxRuntimeError = require('../../../errors/DetoxRuntimeError');

const DeviceAllocatorFactory = require('./base');

class External extends DeviceAllocatorFactory {
  static validateModule(module, path) {
    if (!module.DeviceAllocationDriverClass) {
      throw new DetoxRuntimeError(`The custom driver at '${path}' does not export the DeviceAllocationDriverClass property`);
    }

    if (!module.DeviceDeallocationDriverClass) {
      throw new DetoxRuntimeError(`The custom driver at '${path}' does not export the DeviceDeallocationDriverClass property`);
    }
  }

  constructor(module, path) {
    super();
    External.validateModule(module, path);

    this._module = module;
  }

  _createDriver(deps) {
    return {
      allocDriver: new this._module.DeviceAllocationDriverClass(deps),
      createDeallocDriver: (deviceCookie) => new this._module.DeviceDeallocationDriverClass(deviceCookie, deps),
    };
  }
}

module.exports = { External };
