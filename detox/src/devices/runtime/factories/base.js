/* eslint @typescript-eslint/no-unused-vars: ["error", { "args": "none" }] */
const RuntimeDevice = require('../RuntimeDevice');

class RuntimeDeviceFactory {
  createRuntimeDevice(deviceCookie, commonDeps, configs) {
    const deps = this._createDriverDependencies(commonDeps, deviceCookie);
    const runtimeDriver = this._createDriver(deviceCookie, deps, configs);
    return new RuntimeDevice({ ...commonDeps, ...configs }, runtimeDriver);
  }

  _createDriverDependencies(commonDeps, deviceCookie) { }
  _createDriver(deviceCookie, deps, configs) {}
}

module.exports = RuntimeDeviceFactory;
