const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const FileArtifact = require('./templates/artifact/FileArtifact');
const log = require('../utils/logger').child({ __filename });
const ArtifactPathBuilder = require('./utils/ArtifactPathBuilder');

class ArtifactsManager {
  constructor({ rootDir, pathBuilder, plugins } = {}) {
    this.onTerminate = _.once(this.onTerminate.bind(this));

    this._pluginConfigs = plugins;
    this._idlePromise = Promise.resolve();
    this._idleCallbackRequests = [];
    this._activeArtifacts = [];
    this._artifactPlugins = {};

    this._pathBuilder = this._instantiatePathBuilder(pathBuilder, rootDir);
  }

  _instantiatePathBuilder(pathBuilderFactory, rootDir) {
    if (typeof pathBuilderFactory === 'function') {
      return pathBuilderFactory({ rootDir });
    }

    if (pathBuilderFactory) {
      return pathBuilderFactory;
    }

    return new ArtifactPathBuilder({ rootDir });
  }

  _instantitateArtifactPlugin(pluginFactory, pluginUserConfig) {
    const artifactsApi = {
      plugin: null,

      userConfig: { ...pluginUserConfig },

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
    for (const [key, factory] of Object.entries(artifactPluginFactoriesMap)) {
      const config = this._pluginConfigs[key];
      this._artifactPlugins[key] = this._instantitateArtifactPlugin(factory, config);
    }
  }

  subscribeToDeviceEvents(deviceEmitter) {
    deviceEmitter.on('bootDevice', this.onBootDevice.bind(this));
    deviceEmitter.on('beforeShutdownDevice', this.onBeforeShutdownDevice.bind(this));
    deviceEmitter.on('shutdownDevice', this.onShutdownDevice.bind(this));
    deviceEmitter.on('beforeLaunchApp', this.onBeforeLaunchApp.bind(this));
    deviceEmitter.on('launchApp', this.onLaunchApp.bind(this));
    deviceEmitter.on('beforeUninstallApp', this.onBeforeUninstallApp.bind(this));
    deviceEmitter.on('beforeTerminateApp', this.onBeforeTerminateApp.bind(this));
    deviceEmitter.on('terminateApp', this.onTerminateApp.bind(this));
    deviceEmitter.on('createExternalArtifact', this.onCreateExternalArtifact.bind(this));
  }

  async onBootDevice(deviceInfo) {
    await this._callPlugins('plain', 'onBootDevice', deviceInfo);
  }

  async onBeforeTerminateApp(appInfo) {
    await this._callPlugins('plain', 'onBeforeTerminateApp', appInfo);
  }

  async onTerminateApp(appInfo) {
    await this._callPlugins('plain', 'onTerminateApp', appInfo);
  }

  async onBeforeUninstallApp(appInfo) {
    await this._callPlugins('plain', 'onBeforeUninstallApp', appInfo);
  }

  async onBeforeShutdownDevice(deviceInfo) {
    await this._callPlugins('plain', 'onBeforeShutdownDevice', deviceInfo);
  }

  async onShutdownDevice(deviceInfo) {
    await this._callPlugins('plain', 'onShutdownDevice', deviceInfo);
  }

  async onBeforeLaunchApp(appLaunchInfo) {
    await this._callPlugins('plain', 'onBeforeLaunchApp', appLaunchInfo);
  }

  async onLaunchApp(appLaunchInfo) {
    await this._callPlugins('plain', 'onLaunchApp', appLaunchInfo);
  }

  async onCreateExternalArtifact({ pluginId, artifactName, artifactPath }) {
    await this._callSinglePlugin(pluginId, 'onCreateExternalArtifact', {
      artifact: new FileArtifact({ temporaryPath: artifactPath }),
      name: artifactName,
    });
  }

  async onTestStart(testSummary) {
    await this._callPlugins('ascending', 'onTestStart', testSummary);
  }

  async onTestDone(testSummary) {
    await this._callPlugins('descending', 'onTestDone', testSummary);
  }

  async onBeforeCleanup() {
    await this._callPlugins('descending', 'onBeforeCleanup');
    await this._idlePromise;
  }

  async onTerminate() {
    if (_.isEmpty(this._artifactPlugins)) {
      return;
    }

    log.info({ event: 'TERMINATE_START' }, 'finalizing the recorded artifacts, this can take some time...');

    await this._callPlugins('plain', 'onTerminate');

    const allCallbackRequests = this._idleCallbackRequests.splice(0);
    await Promise.all(allCallbackRequests.map(this._executeIdleCallbackRequest.bind(this)));
    await this._idlePromise;

    await Promise.all(this._activeArtifacts.map(artifact => artifact.discard()));
    await this._idlePromise;

    for (const key of Object.keys(this._activeArtifacts)) {
      delete this._artifactPlugins[key];
    }

    log.info({ event: 'TERMINATE_SUCCESS' }, 'done.');
  }

  async _callSinglePlugin(pluginId, methodName, ...args) {
    const callSignature = this._composeCallSignature('artifactsManager', methodName, args);
    log.trace(Object.assign({ event: 'LIFECYCLE', fn: methodName }, ...args), callSignature);

    const plugin = this._artifactPlugins[pluginId];
    try {
      await plugin[methodName](...args);
    } catch (e) {
      this._unhandledPluginExceptionHandler(e, { plugin, methodName, args });
    }
  }

  async _callPlugins(strategy, methodName, ...args) {
    const callSignature = this._composeCallSignature('artifactsManager', methodName, args);
    log.trace(Object.assign({ event: 'LIFECYCLE', fn: methodName }, ...args), callSignature);

    for (const pluginGroup of this._groupPlugins(strategy)) {
      await Promise.all(pluginGroup.map(async (plugin) => {
        try {
          await plugin[methodName](...args);
        } catch (e) {
          this._unhandledPluginExceptionHandler(e, { plugin, methodName, args });
        }
      }));
    }
  }

  _groupPlugins(strategy) {
    if (strategy === 'plain') {
      return [_.values(this._artifactPlugins)];
    }

    const pluginsByPriority = _.chain(this._artifactPlugins)
      .values()
      .groupBy('priority')
      .entries()
      .sortBy(([priority]) => Number(priority))
      .map(1)
      .value();

    switch (strategy) {
      case 'descending':
        return pluginsByPriority.reverse();
      case 'ascending':
        return pluginsByPriority;
      /* istanbul ignore next */
      default: // is
        throw new Error(`Unknown plugins grouping strategy: ${strategy}`);
    }
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
