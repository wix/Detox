class RuntimeDriverFactoryBase {
  createDriver(deviceCookie, commonDeps) {
    const deps = this._createDependencies(commonDeps);
    return this._createDriver(deviceCookie, deps);
  }

  _createDependencies(commonDeps) { }
  _createDriver(deviceCookie, deps) {}
}

module.exports = RuntimeDriverFactoryBase;
