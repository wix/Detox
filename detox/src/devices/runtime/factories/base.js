const RuntimeDevice = require('../RuntimeDevice');

class RuntimeDeviceFactory {
  createRuntimeDevice(deviceCookie, commonDeps, configs) {
    const deps = this._createDriverDependencies(commonDeps, configs);
    const runtimeDriver = this._createDriver(deviceCookie, deps, configs);
    return new RuntimeDevice({ ...commonDeps, ...configs }, runtimeDriver);
  }

  _createDriverDependencies(commonDeps, configs) { } // eslint-disable-line no-unused-vars
  _createDriver(deviceCookie, deps, configs) {} // eslint-disable-line no-unused-vars
}

module.exports = RuntimeDeviceFactory;
