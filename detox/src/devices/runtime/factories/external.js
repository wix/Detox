const RuntimeDeviceFactory = require('./base');

class External extends RuntimeDeviceFactory {
  static validateModule(module, path) {
    const DetoxRuntimeError = require('../../../errors/DetoxRuntimeError');

    if (!module.RuntimeDriverClass) {
      throw new DetoxRuntimeError(`The custom driver at '${path}' does not export the RuntimeDriverClass property`);
    }
  }

  constructor(module, path) {
    super();
    External.validateModule(module, path);

    this._module = module;
  }

  _createDriverDependencies(commonDeps) {
    return { ...commonDeps };
  }

  _createDriver(deviceCookie, deps) {
    return new this._module.RuntimeDriverClass(deps, deviceCookie);
  }
}

module.exports = {
  External,
};
