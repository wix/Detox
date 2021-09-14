class RuntimeDriverFactoryBase {
  createDriver(deviceCookie, commonDeps) {
    const deps = this._createDependencies(commonDeps);
    return this._createDriver(deviceCookie, deps);
  }

  _createDependencies(commonDeps) { } // eslint-disable-line no-unused-vars
  _createDriver(deviceCookie, deps) {} // eslint-disable-line no-unused-vars
}

module.exports = RuntimeDriverFactoryBase;
