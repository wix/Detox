const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const log = require('../utils/logger').child({ __filename });
const argparse = require('../utils/argparse');
const DetoxRuntimeError = require('../errors/DetoxRuntimeError');
const ArtifactPathBuilder = require('./utils/ArtifactPathBuilder');

class ArtifactsManager {
  constructor(pathBuilder) {
    this.onBeforeResetDevice = this.onBeforeResetDevice.bind(this);
    this.onResetDevice = this.onResetDevice.bind(this);
    this.onBeforeLaunchApp = this.onBeforeLaunchApp.bind(this);
    this.onLaunchApp = this.onLaunchApp.bind(this);
    this.onTerminate = _.once(this.onTerminate.bind(this));
    this._executeIdleCallback = this._executeIdleCallback.bind(this);

    this._idlePromise = Promise.resolve();
    this._onIdleCallbacks = [];
    this._activeArtifacts = [];
    this._artifactPluginsFactories = [];
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

  async onBeforeLaunchApp(launchInfo) {
    const { deviceId, bundleId } = launchInfo;
    const isFirstTime = !this._deviceId;

    this._deviceId = deviceId;
    this._bundleId = bundleId;

    return isFirstTime
      ? this._onBeforeLaunchAppFirstTime(launchInfo)
      : this._onBeforeRelaunchApp();
  }

  async _onBeforeLaunchAppFirstTime(launchInfo) {
    log.trace({ event: 'LIFECYCLE', fn: 'onBeforeLaunchApp' }, 'onBeforeLaunchApp', launchInfo);
    this._artifactPlugins = this._instantiateArtifactPlugins();
  }

  _instantiateArtifactPlugins() {
    return this._artifactPluginsFactories.map((factory) => {
      return factory(this.artifactsApi);
    });
  }

  async _onBeforeRelaunchApp() {
    await this._emit('onBeforeRelaunchApp', [{
      deviceId: this._deviceId,
      bundleId: this._bundleId,
    }]);
  }

  async onLaunchApp(launchInfo) {
    const isFirstTime = isNaN(this._pid);
    if (isFirstTime) {
      log.trace({ event: 'LIFECYCLE', fn: 'onLaunchApp' }, 'onLaunchApp', launchInfo);
    }

    const { deviceId, bundleId, pid } = launchInfo;
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