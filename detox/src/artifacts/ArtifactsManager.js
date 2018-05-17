const _ = require('lodash');
const fs = require('fs-extra');

class ArtifactsManager {
  constructor({ artifactsRootDir }) {
    this.artifactsRootDir = artifactsRootDir;
    this.hooks = [];
 }

  registerHooks(hooks) {
    this._ensureMethodExists(hooks, 'onStart');
    this._ensureMethodExists(hooks, 'onBeforeTest');
    this._ensureMethodExists(hooks, 'onAfterTest');
    this._ensureMethodExists(hooks, 'onExit');

    this.hooks.push(hooks);
    return this;
  }

  _ensureMethodExists(obj, method) {
    if (!(method in obj)) {
      obj[method] = _.noop;
    }
  }

  async onStart() {
    await fs.ensureDir(this.artifactsRootDir);
    await Promise.all(this.hooks.map(hook => hook.onStart()));
  }

  async onBeforeTest(testSummary) {
    await Promise.all(this.hooks.map(hook => hook.onBeforeTest(testSummary)));
  }

  async onAfterTest(testSummary) {
    await Promise.all(this.hooks.map(hook => hook.onAfterTest(testSummary)));
  }

  async onExit() {
    await Promise.all(this.hooks.map(hook => hook.onExit()));
  }
}

module.exports = ArtifactsManager;