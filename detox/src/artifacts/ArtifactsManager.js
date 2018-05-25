const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const log = require('npmlog');
const argparse = require('../utils/argparse');
const logError = require('../utils/logError');
const DetoxRuntimeError = require('../errors/DetoxRuntimeError');
const ArtifactPathBuilder = require('./utils/ArtifactPathBuilder');

class ArtifactsManager {
  constructor() {
    this._idlePromise = Promise.resolve();
    this._activeArtifacts = [];
    this._artifactPlugins = [];

    this._deviceId = '';
    this._bundleId = '';
    this._pid = NaN;
    this._terminated = false;

    const pathBuilder = new ArtifactPathBuilder({
      artifactsRootDir: argparse.getArgValue('artifacts-location') || 'artifacts',
    });

    this.artifactsApi = {
      getDeviceId: () => {
        if (!this._deviceId) {
          throw new DetoxRuntimeError({
            message: 'Detox Artifacts API had no deviceId at the time of calling',
          });
        }

        return this._deviceId;
      },

      getBundleId: () => {
        if (!this._bundleId) {
          throw new DetoxRuntimeError({
            message: 'Detox Artifacts API had no bundleId at the time of calling',
          });
        }

        return this._bundleId;
      },

      getPid: () => {
        if (!this._pid) {
          throw new DetoxRuntimeError({
            message: 'Detox Artifacts API had no app pid at the time of calling',
          });
        }

        return this._pid;
      },

      preparePathForArtifact: async (artifactName, testSummary) => {
        const artifactPath = pathBuilder.buildPathForTestArtifact(artifactName, testSummary);
        const artifactDir = path.dirname(artifactPath);
        await fs.ensureDir(artifactDir);

        return artifactPath;
      },

      trackArtifact: (artifact) => {
        this._activeArtifacts.push(artifact);
      },

      untrackArtifact(artifact) {
        _.pull(this._activeArtifacts, artifact);
      },

      requestIdleCallback: (callback) => {
        this._idlePromise = this._idlePromise
          .then(callback)
          .catch(e => this._errorHandler(e, {
            plugin: { name: 'unknown '},
            methodName: 'onIdleCallback',
            args: []
          }));
      },
    };
  }

  registerArtifactPlugins(artifactPluginFactoriesMap = {}) {
    const artifactPluginFactories = Object.values(artifactPluginFactoriesMap);
    this._artifactPlugins = artifactPluginFactories.map(factory => factory(this.artifactsApi));
  }

  subscribeToDeviceEvents(device) {
    device.on('beforeResetDevice', async (e) => this.onBeforeResetDevice(e));
    device.on('resetDevice', async (e) => this.onResetDevice(e));
    device.on('launchApp', async (e) => this.onLaunchApp(e));
  }

  async onLaunchApp({ deviceId, bundleId, pid }) {
    const isFirstTime = !this._deviceId;

    this._deviceId = deviceId;
    this._bundleId = bundleId;
    this._pid = pid;

    if (!isFirstTime) {
      await this._emit('onRelaunchApp', [{ deviceId, bundleId, pid}]);
    }
  }

  async onBeforeAll() {
    await this._emit('onBeforeAll', []);
  }

  async onBeforeTest(testSummary) {
    await this._emit('onBeforeTest', [testSummary]);
  }

  async onBeforeResetDevice({ deviceId }) {
    await this._emit('onBeforeResetDevice', [{ deviceId }]);
  }

  async onResetDevice({ deviceId }) {
    await this._emit('onResetDevice', [{ deviceId }]);
  }

  async onAfterTest(testSummary) {
    await this._emit('onAfterTest', [testSummary]);
  }

  async onAfterAll() {
    await this._emit('onAfterAll', []);
    await this._idlePromise;
    log.verbose('ArtifactsManager', 'finalized artifacts successfully');
  }

  onTerminate() {
    if (this._terminated) {
      return;
    }

    this._terminated = true;

    for (const artifact of this._artifactPlugins) {
      artifact.onTerminate();
    }

    for (const artifact of this._activeArtifacts) {
      artifact.kill();
    }

    log.info('ArtifactsManager', 'terminated all artifacts');
  }

  async _emit(methodName, args) {
    await Promise.all(this._artifactPlugins.map(async (plugin) => {
      try {
        await plugin[methodName](...args);
      } catch (e) {
        this._errorHandler(e, { plugin, methodName, args });
      }
    }));
  }

  _errorHandler(e, { plugin, methodName }) {
    log.error('ArtifactsManager', 'Caught exception inside plugin (%s) at phase %s', plugin.name || 'unknown', methodName);
    logError(e, 'ArtifactsManager');
  }
}


module.exports = ArtifactsManager;