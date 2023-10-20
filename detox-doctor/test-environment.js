const fse = require('fs-extra');
const JEN = require('jest-environment-node');
const NodeTestEnvironment = JEN.default || JEN;
const globalRequire = require;

class GlobalTestEnvironment extends NodeTestEnvironment {
  constructor(config, context) {
    super(config, context);
    this.global.__REQUIRE__ = globalRequire;
    this.global.__TEMPORARY_FILES__ = [];
  }

  async teardown() {
    await super.teardown();
    await Promise.all(
      this.global.__TEMPORARY_FILES__.map(file => fse.remove(file))
    );
  }
}

module.exports = GlobalTestEnvironment;
