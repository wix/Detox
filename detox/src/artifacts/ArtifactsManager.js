const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const log = require('../utils/logger').child({ __filename });
const argparse = require('../utils/argparse');
const ArtifactPathBuilder = require('./utils/ArtifactPathBuilder');

class ArtifactsManager {
  constructor(pathBuilder) {
    this.onTerminate = _.once(this.onTerminate.bind(this));

    this._idlePromise = Promise.resolve();
    this._idleCallbackRequests = [];
    this._activeArtifacts = [];
    this._artifactPlugins = [];
    this._pathBuilder = pathBuilder || new ArtifactPathBuilder({
      artifactsRootDir: argparse.getArgValue('artifacts-location') || 'artifacts',
    });
  }

  _instantitateArtifactPlugin(pluginFactory) {
    const artifactsApi = {
      plugin: null,

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

      requestIdleCallback: (callback) => {
        this._idleCallbackRequests.push({
          caller: artifactsApi.plugin,
          callback,
        });

        this._idlePromise = this._idlePromise.then(() => {
          const nextCallbackRequest = this._idleCallbackRequests.shift();

          if (nextCallbackRequest) {
            return this._executeIdleCallbackRequest(nextCallbackRequest);
          }
        });
      },
    };

    const plugin = pluginFactory(artifactsApi);
    artifactsApi.plugin = plugin;

    return plugin;
  }

  _executeIdleCallbackRequest({ callback, caller }) {
    return Promise.resolve()
      .then(callback)
      .catch(e => this._idleCallbackErrorHandle(e, caller));
  }

  registerArtifactPlugins(artifactPluginFactoriesMap = {}) {
    const artifactPluginsFactories = Object.values(artifactPluginFactoriesMap);

    this._artifactPlugins = artifactPluginsFactories.map((factory) => {
      return this._instantitateArtifactPlugin(factory);
    });
  }

  subscribeToDeviceEvents(deviceEmitter) {
    deviceEmitter.on('bootDevice', this.onBootDevice.bind(this));
    deviceEmitter.on('beforeShutdownDevice', this.onBeforeShutdownDevice.bind(this));
    deviceEmitter.on('shutdownDevice', this.onShutdownDevice.bind(this));
    deviceEmitter.on('beforeLaunchApp', this.onBeforeLaunchApp.bind(this));
    deviceEmitter.on('launchApp', this.onLaunchApp.bind(this));
    deviceEmitter.on('beforeTerminateApp', this.onBeforeTerminateApp.bind(this));
  }

  async onBootDevice(deviceInfo) {
    await this._callPlugins('onBootDevice', deviceInfo);
  }

  async onBeforeTerminateApp(appInfo) {
    await this._callPlugins('onBeforeTerminateApp', appInfo);
  }

  async onBeforeShutdownDevice(deviceInfo) {
    await this._callPlugins('onBeforeShutdownDevice', deviceInfo);
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

    const allCallbackRequests = this._idleCallbackRequests.splice(0);
    await Promise.all(allCallbackRequests.map(this._executeIdleCallbackRequest.bind(this)));
    await this._idlePromise;

    await Promise.all(this._activeArtifacts.map(artifact => artifact.discard()));
    await this._idlePromise;
    this._artifactPlugins.splice(0);

    log.info({ event: 'TERMINATE_SUCCESS' }, 'done.');
  }

  async _callPlugins(methodName, ...args) {
    const callSignature = this._composeCallSignature('artifactsManager', methodName, args);
    log.trace(Object.assign({ event: 'LIFECYCLE', fn: methodName }, ...args), callSignature);

    await Promise.all(this._artifactPlugins.map(async (plugin) => {
      try {
        await plugin[methodName](...args);
      } catch (e) {
        this._unhandledPluginExceptionHandler(e, { plugin, methodName, args });
      }
    }));
  }

  _composeCallSignature(object, methodName, args) {
    const argsString = args.map(arg => util.inspect(arg)).join(', ');
    return `${object}.${methodName}(${argsString})`;
  }

  _unhandledPluginExceptionHandler(err, { plugin, methodName, args }) {
    const logObject = {
      event: 'SUPPRESS_PLUGIN_ERROR',
      plugin: plugin.name,
      err,
      methodName,
    };

    const callSignature = this._composeCallSignature(plugin.name, methodName, args);
    log.warn(logObject, `Suppressed error inside function call: ${callSignature}`);
  }

  _idleCallbackErrorHandle(err, caller) {
    this._unhandledPluginExceptionHandler(err, {
      plugin: caller,
      methodName: 'onIdleCallback',
      args: []
    })
  }
}


module.exports = ArtifactsManager;
