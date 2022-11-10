const EventEmitter = require('events');
const path = require('path');

const fs = require('fs-extra');
const _ = require('lodash');

const DetoxRuntimeError = require('../errors/DetoxRuntimeError');
const log = require('../utils/logger').child({ cat: 'artifacts-manager,artifact' });
const resolveModuleFromPath = require('../utils/resolveModuleFromPath');
const traceMethods = require('../utils/traceMethods');

const FileArtifact = require('./templates/artifact/FileArtifact');
const ArtifactPathBuilder = require('./utils/ArtifactPathBuilder');

class ArtifactsManager extends EventEmitter {
  constructor({ rootDir, pathBuilder, plugins }) {
    super();

    this._pluginConfigs = plugins;
    this._idlePromise = Promise.resolve();
    this._idleCallbackRequests = [];
    this._artifactPlugins = {};
    this._pathBuilder = this._resolveArtifactsPathBuilder(pathBuilder, rootDir);

    traceMethods(log, this, [
      'onAppReady',
      'onBeforeCleanup',
      'onBeforeLaunchApp',
      'onBeforeShutdownDevice',
      'onBeforeTerminateApp',
      'onBeforeUninstallApp',
      'onBootDevice',
      'onCreateExternalArtifact',
      'onHookFailure',
      'onLaunchApp',
      'onRunDescribeFinish',
      'onRunDescribeStart',
      'onShutdownDevice',
      'onTerminateApp',
      'onTestDone',
      'onTestFnFailure',
      'onTestStart',
    ]);
  }

  _resolveArtifactsPathBuilder(pathBuilder, rootDir) {
    if (typeof pathBuilder === 'string') {
      pathBuilder = resolveModuleFromPath(pathBuilder);
    }

    if (typeof pathBuilder === 'function') {
      try {
        pathBuilder = pathBuilder({ rootDir });
      } catch (e) {
        pathBuilder = new pathBuilder({ rootDir });
      }
    }

    if (!pathBuilder) {
      pathBuilder = new ArtifactPathBuilder({ rootDir });
    }

    return pathBuilder;
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

      trackArtifact: (artifact) => {
        this.emit('trackArtifact', artifact);
      },

      untrackArtifact: (artifact) => {
        this.emit('untrackArtifact', artifact);
      },

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

        return this._idlePromise;
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

  async onRunDescribeStart(suite) {
    await this._callPlugins('ascending', 'onRunDescribeStart', suite);
  }

  async onTestStart(testSummary) {
    await this._callPlugins('ascending', 'onTestStart', testSummary);
  }

  async onHookFailure(testSummary) {
    await this._callPlugins('plain', 'onHookFailure', testSummary);
  }

  async onTestFnFailure(testSummary) {
    await this._callPlugins('plain', 'onTestFnFailure', testSummary);
  }

  async onTestDone(testSummary) {
    await this._callPlugins('descending', 'onTestDone', testSummary);
  }

  async onRunDescribeFinish(suite) {
    await this._callPlugins('descending', 'onRunDescribeFinish', suite);
  }

  async onBeforeCleanup() {
    await this._callPlugins('descending', 'onBeforeCleanup');
    await this._idlePromise;
  }

  async _callSinglePlugin(pluginId, methodName, ...args) {
    const plugin = this._artifactPlugins[pluginId];
    try {
      await plugin[methodName](...args);
    } catch (e) {
      this._unhandledPluginExceptionHandler(e, { plugin, methodName });
    }
  }

  async _callPlugins(strategy, methodName, ...args) {
    for (const pluginGroup of this._groupPlugins(strategy)) {
      await Promise.all(pluginGroup.map(async (plugin) => {
        try {
          await plugin[methodName](...args);
        } catch (e) {
          this._unhandledPluginExceptionHandler(e, { plugin, methodName });
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
        throw new DetoxRuntimeError(`Unknown plugins grouping strategy: ${strategy}`);
    }
  }

  _unhandledPluginExceptionHandler(err, { plugin, methodName }) {
    const logObject = {
      plugin: plugin.name,
      methodName,
      err,
    };

    log.warn(logObject, `Suppressed error inside function call.`);
  }

  _idleCallbackErrorHandle(err, caller) {
    this._unhandledPluginExceptionHandler(err, {
      plugin: caller,
      methodName: 'onIdleCallback',
    });
  }
}

module.exports = ArtifactsManager;
