const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const FileArtifact = require('./templates/artifact/FileArtifact');
const log = require('../utils/logger').child({ __filename });

class ArtifactsManager {
  constructor({ pathBuilder, plugins }) {
    this._pluginConfigs = plugins;
    this._idlePromise = Promise.resolve();
    this._idleCallbackRequests = [];
    this._artifactPlugins = {};
    this._pathBuilder = pathBuilder;
  }

  _instantiateArtifactPlugin(pluginFactory, pluginUserConfig) {
    const artifactsApi = {
      plugin: null,

      userConfig: { ...pluginUserConfig },

      preparePathForArtifact: async (artifactName, testSummary) => {
        const artifactPath = this._pathBuilder.buildPathForTestArtifact(artifactName, testSummary);
        const artifactDir = path.dirname(artifactPath);
        await fs.ensureDir(artifactDir);

        return artifactPath;
      },

      trackArtifact: _.noop,
      untrackArtifact: _.noop,

      requestIdleCallback: (callback) => {
        this._idleCallbackRequests.push({
          caller: artifactsApi.plugin,
          callback,
        });

        this._idlePromise = this._idlePromise.then(() => {
          const nextCallbackRequest = this._idleCallbackRequests.shift();

          /* istanbul ignore else  */
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

  registerArtifactPlugins(artifactPluginFactoriesMap) {
    for (const [key, factory] of Object.entries(artifactPluginFactoriesMap)) {
      const config = this._pluginConfigs[key];
      this._artifactPlugins[key] = this._instantiateArtifactPlugin(factory, config);
    }
  }

  subscribeToDeviceEvents(deviceEmitter) {
    deviceEmitter.on('bootDevice', this.onBootDevice.bind(this));
    deviceEmitter.on('beforeShutdownDevice', this.onBeforeShutdownDevice.bind(this));
    deviceEmitter.on('shutdownDevice', this.onShutdownDevice.bind(this));
    deviceEmitter.on('beforeLaunchApp', this.onBeforeLaunchApp.bind(this));
    deviceEmitter.on('launchApp', this.onLaunchApp.bind(this));
    deviceEmitter.on('appReady', this.onAppReady.bind(this));
    deviceEmitter.on('beforeUninstallApp', this.onBeforeUninstallApp.bind(this));
    deviceEmitter.on('beforeTerminateApp', this.onBeforeTerminateApp.bind(this));
    deviceEmitter.on('terminateApp', this.onTerminateApp.bind(this));
    deviceEmitter.on('createExternalArtifact', this.onCreateExternalArtifact.bind(this));
  }

  async onBootDevice(deviceInfo) {
    await this._callPlugins('plain', 'onBootDevice', deviceInfo);
  }

  async onBeforeLaunchApp(appLaunchInfo) {
    await this._callPlugins('plain', 'onBeforeLaunchApp', appLaunchInfo);
  }

  async onLaunchApp(appLaunchInfo) {
    await this._callPlugins('plain', 'onLaunchApp', appLaunchInfo);
  }

  async onAppReady(appInfo) {
    await this._callPlugins('plain', 'onAppReady', appInfo);
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

  async onCreateExternalArtifact({ pluginId, artifactName, artifactPath }) {
    await this._callSinglePlugin(pluginId, 'onCreateExternalArtifact', {
      artifact: new FileArtifact({ temporaryPath: artifactPath }),
      name: artifactName,
    });
  }

  async onRunStart() {}

  async onRunDescribeStart(suite) {
    await this._callPlugins('ascending', 'onRunDescribeStart', suite);
  }

  async onTestStart(testSummary) {
    await this._callPlugins('ascending', 'onTestStart', testSummary);
  }

  async onHookStart() {}

  async onHookFailure(testSummary) {
    await this._callPlugins('plain', 'onHookFailure', testSummary);
  }

  async onHookSuccess() {}

  async onTestFnStart() {}

  async onTestFnFailure(testSummary) {
    await this._callPlugins('plain', 'onTestFnFailure', testSummary);
  }

  async onTestFnSuccess() {}

  async onTestDone(testSummary) {
    await this._callPlugins('descending', 'onTestDone', testSummary);
  }

  async onRunDescribeFinish(suite) {
    await this._callPlugins('descending', 'onRunDescribeFinish', suite);
  }

  async onRunFinish() {}

  async onBeforeCleanup() {
    await this._callPlugins('descending', 'onBeforeCleanup');
    await this._idlePromise;
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
