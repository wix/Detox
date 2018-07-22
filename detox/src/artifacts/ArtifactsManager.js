const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const log = require('npmlog');
const argparse = require('../utils/argparse');
const logError = require('../utils/logError');
const DetoxRuntimeError = require('../errors/DetoxRuntimeError');
const ArtifactPathBuilder = require('./utils/ArtifactPathBuilder');

class ArtifactsManager {
  constructor(pathBuilder) {
    this.onBootDevice = this.onBootDevice.bind(this);
    this.onBeforeLaunchApp = this.onBeforeLaunchApp.bind(this);
    this.onLaunchApp = this.onLaunchApp.bind(this);
    this.onTerminate = _.once(this.onTerminate.bind(this));
    this._executeIdleCallback = this._executeIdleCallback.bind(this);

    this._idlePromise = Promise.resolve();
    this._onIdleCallbacks = [];
    this._activeArtifacts = [];
    this._artifactPlugins = [];
    this._pathBuilder = pathBuilder || new ArtifactPathBuilder({
      artifactsRootDir: argparse.getArgValue('artifacts-location') || 'artifacts',
    });

    this._deviceId = '';
    this._bundleId = '';
    this._pid = NaN;

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
        if (isNaN(this._pid)) {
          throw new DetoxRuntimeError({
            message: 'Detox Artifacts API had no app PID at the time of calling',
          });
        }

        return this._pid;
      },

      preparePathForArtifact: async (artifactName, testSummary) => {
        const artifactPath = this._pathBuilder.buildPathForTestArtifact(artifactName, testSummary);
        const artifactDir = path.dirname(artifactPath);
        await fs.ensureDir(artifactDir);

        return artifactPath;
      },

      trackArtifact: (artifact) => {
        this._activeArtifacts.push(artifact);
      },

      untrackArtifact: (artifact) => {
        _.pull(this._activeArtifacts, artifact);
      },

      requestIdleCallback: (callback, caller) => {
        if (caller) {
          callback._from = caller.name;
        }

        this._onIdleCallbacks.push(callback);

        this._idlePromise = this._idlePromise.then(() => {
          const nextCallback = this._onIdleCallbacks.shift();
          return this._executeIdleCallback(nextCallback);
        });
      },
    };
  }

  _executeIdleCallback(callback) {
    if (callback) {
      return Promise.resolve()
        .then(callback)
        .catch(e => this._idleCallbackErrorHandle(e, callback));
    }
  }

  registerArtifactPlugins(artifactPluginFactoriesMap = {}) {
    const api = this.artifactsApi;
    const artifactPluginsFactories = Object.values(artifactPluginFactoriesMap);

    this._artifactPlugins = artifactPluginsFactories.map(factory => factory(api));
  }

  subscribeToDetoxEvents(emitter) {
    emitter.on('bootDevice', this.onBootDevice);
    emitter.on('beforeLaunchApp', this.onBeforeLaunchApp);
    emitter.on('launchApp', this.onLaunchApp);
  }

  unsubscribeFromDetoxEvents(emitter) {
    emitter.off('launchApp', this.onLaunchApp);
    emitter.off('beforeLaunchApp', this.onBeforeLaunchApp);
    emitter.off('bootDevice', this.onBootDevice);
  }

  async onBootDevice({ coldBoot, deviceId }) {
    this._deviceId = deviceId;

    await this._emit('onBootDevice', [{
      coldBoot,
      deviceId: this._deviceId,
    }]);
  }

  async onBeforeLaunchApp({ bundleId, deviceId }) {
    this._bundleId = bundleId;
    this._deviceId = deviceId;
    this._pid = NaN;

    await this._emit('onBeforeLaunchApp', [{
      bundleId: this._bundleId,
      deviceId: this._deviceId,
    }]);
  }

  async onLaunchApp({ bundleId, deviceId, pid }) {
    this._bundleId = bundleId;
    this._deviceId = deviceId;
    this._pid = pid;

    await this._emit('onLaunchApp', [{
      bundleId,
      deviceId,
      pid,
    }]);
  }

  async onBeforeAll() {
    await this._emit('onBeforeAll', []);
  }

  async onBeforeEach(testSummary) {
    await this._emit('onBeforeEach', [testSummary]);
  }

  async onAfterEach(testSummary) {
    await this._emit('onAfterEach', [testSummary]);
  }

  async onAfterAll() {
    await this._emit('onAfterAll', []);
    await this._idlePromise;
    log.verbose('ArtifactsManager', 'finalized artifacts successfully');
  }

  async onTerminate() {
    if (this._artifactPlugins.length === 0) {
      return;
    }

    log.info('ArtifactsManager', 'finalizing all artifacts, this can take some time');
    await this._emit('onTerminate', []);
    await Promise.all(this._onIdleCallbacks.splice(0).map(this._executeIdleCallback));
    await this._idlePromise;

    await Promise.all(this._activeArtifacts.map(artifact => artifact.discard()));
    await this._idlePromise;
    this._artifactPlugins.splice(0);
    log.info('ArtifactsManager', 'finalized all artifacts');
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

  _idleCallbackErrorHandle(e, callback) {
    this._errorHandler(e, {
      plugin: { name: callback._from },
      methodName: 'onIdleCallback',
      args: []
    })
  }
}


module.exports = ArtifactsManager;