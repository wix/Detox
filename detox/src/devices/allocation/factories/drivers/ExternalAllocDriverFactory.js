const DetoxRuntimeError = require('../../../../errors/DetoxRuntimeError');

const AllocationDriverFactory = require('./AllocationDriverFactory');

class ExternalAllocDriverFactory extends AllocationDriverFactory {
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
    ExternalAllocDriverFactory.validateModule(module, path);

    this._module = module;
  }

  createAllocationDriver(deps) {
    return {
      allocDriver: new this._module.DeviceAllocationDriverClass(deps),
      createDeallocDriver: (deviceCookie) => new this._module.DeviceDeallocationDriverClass(deviceCookie, deps),
    };
  }
}

module.exports = ExternalAllocDriverFactory;
