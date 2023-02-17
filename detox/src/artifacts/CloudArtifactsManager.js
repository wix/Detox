class CloudArtifactsManager {
  constructor() {
    this._idlePromise = Promise.resolve();
    this._artifactPlugins = {};
  }

  async onBootDevice(deviceInfo) {
    return this._idlePromise;
  }

  async onBeforeLaunchApp(appLaunchInfo) {
    return this._idlePromise;
  }

  async onLaunchApp(appLaunchInfo) {
    return this._idlePromise;
  }

  async onAppReady(appInfo) {
    return this._idlePromise;
  }

  async onBeforeTerminateApp(appInfo) {
    return this._idlePromise;
  }

  async onTerminateApp(appInfo) {
    return this._idlePromise;
  }

  async onBeforeUninstallApp(appInfo) {
    return this._idlePromise;
  }

  async onBeforeShutdownDevice(deviceInfo) {
    return this._idlePromise;
  }

  async onShutdownDevice(deviceInfo) {
    return this._idlePromise;
  }

  async onCreateExternalArtifact({ pluginId, artifactName, artifactPath }) {
    return this._idlePromise;
  }

  async onRunDescribeStart(suite) {
    return this._idlePromise;
  }

  async onTestStart(testSummary) {
    return this._idlePromise;
  }

  async onHookFailure(testSummary) {
    return this._idlePromise;
  }

  async onTestFnFailure(testSummary) {
    return this._idlePromise;
  }

  async onTestDone(testSummary) {
    return this._idlePromise;
  }

  async onRunDescribeFinish(suite) {
    return this._idlePromise;
  }

  async onBeforeCleanup() {
    return this._idlePromise;
  }
}

module.exports = CloudArtifactsManager;
