const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const log = require('../utils/logger').child({ __filename });
const argparse = require('../utils/argparse');
const DetoxRuntimeError = require('../errors/DetoxRuntimeError');
const ArtifactPathBuilder = require('./utils/ArtifactPathBuilder');

class ArtifactsManager {
  constructor(pathBuilder) {
    this.onBootDevice = this.onBootDevice.bind(this);
    this.onShutdownDevice = this.onShutdownDevice.bind(this);
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

    this.artifactsApi = {
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

  subscribeToDeviceEvents(deviceEmitter) {
    deviceEmitter.on('bootDevice', this.onBootDevice);
    deviceEmitter.on('shutdownDevice', this.onShutdownDevice);
    deviceEmitter.on('beforeLaunchApp', this.onBeforeLaunchApp);
    deviceEmitter.on('launchApp', this.onLaunchApp);
  }

  async onBootDevice({ coldBoot, deviceId }) {
    this._deviceId = deviceId;

    await this._emit('onBootDevice', [{
      coldBoot,
      deviceId: this._deviceId,
    }]);
  }

  async onShutdownDevice({ deviceId }) {
    await this._emit('onShutdownDevice', [{
      deviceId,
    }]);
  }

  async onBeforeLaunchApp({ bundleId, deviceId }) {
    await this._emit('onBeforeLaunchApp', [{
      bundleId,
      deviceId,
    }]);
  }

  async onLaunchApp({ bundleId, deviceId, pid }) {
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
  }

  async onTerminate() {
    if (this._artifactPlugins.length === 0) {
      return;
    }

    log.info({ event: 'TERMINATE_START' }, 'finalizing the recorded artifacts, this can take some time...');

    await this._emit('onTerminate', []);
    await Promise.all(this._onIdleCallbacks.splice(0).map(this._executeIdleCallback));
    await this._idlePromise;

    await Promise.all(this._activeArtifacts.map(artifact => artifact.discard()));
    await this._idlePromise;
    this._artifactPlugins.splice(0);

    log.info({ event: 'TERMINATE_SUCCESS' }, 'done.');
  }

  async _emit(methodName, args) {
    log.trace(Object.assign({ event: 'LIFECYCLE', fn: methodName }, ...args), `${methodName}`);

    await Promise.all(this._artifactPlugins.map(async (plugin) => {
      try {
        await plugin[methodName](...args);
      } catch (e) {
        this._errorHandler(e, { plugin, methodName, args });
      }
    }));
  }

  _errorHandler(err, { plugin, methodName }) {
    const eventObject = { event: 'PLUGIN_ERROR', plugin: plugin.name || 'unknown', methodName, err };
    log.error(eventObject, `Caught exception inside plugin (${eventObject.plugin}) at phase ${methodName}`);
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