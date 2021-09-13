const RuntimeDriverFactoryBase = require('./RuntimeDriverFactoryBase');
const DetoxRuntimeError = require('../../../../errors/DetoxRuntimeError');

class ExternalRuntimeDriverFactory extends RuntimeDriverFactoryBase {
  static validateModule(module, path) {
    if (!module.RuntimeDriverClass) {
      throw new DetoxRuntimeError(`The custom driver at '${path}' does not export the RuntimeDriverClass property`);
    }
  }

  constructor(module, path) {
    super();
    ExternalRuntimeDriverFactory.validateModule(module, path);

    this._module = module;
  }

  _createDependencies(commonDeps) {
    return { ...commonDeps };
  }

  _createDriver(deviceCookie, deps) {
    return new this._module.RuntimeDriverClass(deviceCookie, deps);
  }
}

module.exports = ExternalRuntimeDriverFactory;
