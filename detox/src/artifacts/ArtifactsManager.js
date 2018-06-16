const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const log = require('npmlog');
const argparse = require('../utils/argparse');
const environment = require('../utils/environment');
const logError = require('../utils/logError');
const DetoxRuntimeError = require('../errors/DetoxRuntimeError');
const ArtifactPathBuilder = require('./utils/ArtifactPathBuilder');

class ArtifactsManager {
  constructor() {
    this.onBeforeResetDevice = this.onBeforeResetDevice.bind(this);
    this.onResetDevice = this.onResetDevice.bind(this);
    this.onBeforeLaunchApp = this.onBeforeLaunchApp.bind(this);
    this.onLaunchApp = this.onLaunchApp.bind(this);
    this._executeIdleCallback = this._executeIdleCallback.bind(this);

    this.onTerminate = _.once(this.onTerminate.bind(this));

    this._idlePromise = Promise.resolve();
    this._onIdleCallbacks = [];
    this._activeArtifacts = [];
    this._artifactPluginsFactories = [];
    this._artifactPlugins = [];

    this._deviceId = '';
    this._bundleId = '';
    this._pid = NaN;

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

      requestIdleCallback: (callback, caller) => {
        callback._from = caller.name;
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
    this._artifactPluginsFactories = Object.values(artifactPluginFactoriesMap);
  }

  subscribeToDeviceEvents(device) {
    device.on('beforeResetDevice', this.onBeforeResetDevice);
    device.on('resetDevice', this.onResetDevice);
    device.on('beforeLaunchApp', this.onBeforeLaunchApp);
    device.on('launchApp', this.onLaunchApp);
  }

  unsubscribeFromDeviceEvents(device) {
    device.off('beforeResetDevice', this.onBeforeResetDevice);
    device.off('resetDevice', this.onResetDevice);
    device.off('beforeLaunchApp', this.onBeforeLaunchApp);
    device.off('launchApp', this.onLaunchApp);
  }

  async onBeforeLaunchApp({ deviceId, bundleId }) {
    const isFirstTime = !this._deviceId;

    this._deviceId = deviceId;
    this._bundleId = bundleId;

    if (isFirstTime) {
      this._artifactPlugins = this._artifactPluginsFactories.map((factory) => {
        return factory(this.artifactsApi);
      });
    } else {
      // TODO: implement this lifecycle event
      // await this._emit('onBeforeRelaunchApp', [{ deviceId, bundleId }]);
    }
  }

  async onLaunchApp({ deviceId, bundleId, pid }) {
    const isFirstTime = isNaN(this._pid);

    this._deviceId = deviceId;
    this._bundleId = bundleId;
    this._pid = pid;

    if (!isFirstTime) {
      await this._emit('onRelaunchApp', [{ deviceId, bundleId, pid }]);
    }
  }

  async onBeforeAll() {
    await this._emit('onBeforeAll', []);
  }

  async onBeforeEach(testSummary) {
    await this._emit('onBeforeEach', [testSummary]);
  }

  async onBeforeResetDevice({ deviceId }) {
    await this._emit('onBeforeResetDevice', [{ deviceId }]);
  }

  async onResetDevice({ deviceId }) {
    await this._emit('onResetDevice', [{ deviceId }]);
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
    await Promise.all(this._artifactPlugins.map(plugin => plugin.onTerminate()));
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