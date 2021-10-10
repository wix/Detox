class RuntimeDriverFactoryBase {
  createDriver(deviceCookie, commonDeps, configs) {
    const deps = this._createDependencies(commonDeps);
    return this._createDriver(deviceCookie, deps, configs);
  }

  _createDependencies(commonDeps) { } // eslint-disable-line no-unused-vars
  _createDriver(deviceCookie, deps, configs) {} // eslint-disable-line no-unused-vars
}

module.exports = RuntimeDriverFactoryBase;
