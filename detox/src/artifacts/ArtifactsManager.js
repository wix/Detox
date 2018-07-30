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
    this._callersMap = new WeakMap();

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
          this._callersMap.set(callback, caller);
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

  async onBootDevice(deviceInfo) {
    await this._callPlugins('onBootDevice', deviceInfo);
  }

  async onShutdownDevice(deviceInfo) {
    await this._callPlugins('onShutdownDevice', deviceInfo);
  }

  async onBeforeLaunchApp(appLaunchInfo) {
    await this._callPlugins('onBeforeLaunchApp', appLaunchInfo);
  }

  async onLaunchApp(appLaunchInfo) {
    await this._callPlugins('onLaunchApp', appLaunchInfo);
  }

  async onBeforeAll() {
    await this._callPlugins('onBeforeAll');
  }

  async onBeforeEach(testSummary) {
    await this._callPlugins('onBeforeEach', testSummary);
  }

  async onAfterEach(testSummary) {
    await this._callPlugins('onAfterEach', testSummary);
  }

  async onAfterAll() {
    await this._callPlugins('onAfterAll');
    await this._idlePromise;
  }

  async onTerminate() {
    if (this._artifactPlugins.length === 0) {
      return;
    }

    log.info({ event: 'TERMINATE_START' }, 'finalizing the recorded artifacts, this can take some time...');

    await this._callPlugins('onTerminate');
    await Promise.all(this._onIdleCallbacks.splice(0).map(this._executeIdleCallback));
    await this._idlePromise;

    await Promise.all(this._activeArtifacts.map(artifact => artifact.discard()));
    await this._idlePromise;
    this._artifactPlugins.splice(0);

    log.info({ event: 'TERMINATE_SUCCESS' }, 'done.');
  }

  async _callPlugins(methodName, ...args) {
    log.trace(Object.assign({ event: 'LIFECYCLE', fn: methodName }, ...args), `${methodName}`);

    await Promise.all(this._artifactPlugins.map(async (plugin) => {
      try {
        await plugin[methodName](...args);
      } catch (e) {
        this._unhandledPluginExceptionHandler(e, { plugin, methodName, args });
      }
    }));
  }

  _unhandledPluginExceptionHandler(err, { plugin, methodName }) {
    const eventObject = { event: 'PLUGIN_ERROR', plugin: plugin.name || 'unknown', methodName, err };
    log.error(eventObject, `Caught exception inside plugin (${eventObject.plugin}) at phase ${methodName}`);
  }

  _idleCallbackErrorHandle(err, callback) {
    const caller = this._callersMap.get(callback) || {};

    this._unhandledPluginExceptionHandler(err, {
      plugin: caller,
      methodName: 'onIdleCallback',
      args: []
    })
  }
}


module.exports = ArtifactsManager;