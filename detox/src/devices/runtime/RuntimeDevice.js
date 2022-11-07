const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const debug = require('../../utils/debug'); // debug utils, leave here even if unused
const { forEachSeries } = require('../../utils/p-iteration');
const { traceCall } = require('../../utils/trace');

class RuntimeDevice {
  /**
   * @param apps { Object }
   * @param apps.predefinedApps { Object<String, PredefinedTestApp> }
   * @param apps.unspecifiedApp { UnspecifiedTestApp }
   * @param apps.utilApps { UtilApp }
   */
  constructor({ predefinedApps, unspecifiedApp, utilApps }, deps, { deviceConfig }) {
    this._predefinedApps = predefinedApps;
    this._unspecifiedApp = unspecifiedApp;
    this._utilApps = utilApps;
    this._driver = deps.driver;
    this._errorComposer = deps.errorComposer;
    this._eventEmitter = deps.eventEmitter;
    this._deviceConfig = deviceConfig;

    this._selectedApp = null;

    this.debug = debug;
  }

  async init() {
    await this._initApps();

    const appAliases = Object.keys(this._predefinedApps);
    if (appAliases.length === 1) {
      const appAlias = appAliases[0];
      await this.selectPredefinedApp(appAlias);
    }
  }

  async cleanup() {
    await traceCall('deviceCleanup', async () => {
      await this._driver.cleanup();
      await forEachSeries(this._allRunnableApps(), (app) => app.cleanup(), this);
    });
  }

  /**
   * @returns { RunnableTestApp }
   */
  get selectedApp() {
    return this._selectedApp;
  }

  get id() {
    return this._driver.externalId;
  }

  get name() {
    return this._driver.deviceName;
  }

  get platform() {
    return this._driver.platform;
  }

  get type() {
    return this._deviceConfig.type;
  }

  async selectPredefinedApp(appAlias) {
    const app = this._predefinedApps[appAlias];
    if (!app) {
      throw this._errorComposer.cantFindApp(app);
    }

    if (this._selectedApp) {
      await this._selectedApp.deselect();
    }

    this._selectedApp = app;
    await this._selectedApp.select();
  }

  async selectUnspecifiedApp(appConfig) {
    if (this._selectedApp) {
      await this._selectedApp.deselect();
    }

    this._selectedApp = this._unspecifiedApp;
    await this._selectedApp.select(appConfig);
  }

  async installUtilBinaries() {
    await traceCall('installUtilBinaries',
      forEachSeries(this._utilApps, (app) => app.install(), this));
  }

  async reinstallApps(appAliases) {
    const selectedApp = this._selectedApp;

    for (const appAlias of appAliases) {
      const app = this._predefinedApps[appAlias];
      await app.select();
      await app.uninstall();
      await app.deselect();
    }

    for (const appAlias of appAliases) {
      const app = this._predefinedApps[appAlias];
      await app.select();
      await app.install();
      await app.deselect();
    }

    if (selectedApp) {
      await selectedApp.select();
    }
  }

  setInvokeFailuresListener(handler) {
    this._allRunnableApps().forEach((app) => app.setInvokeFailuresListener(handler));
  }

  async startInstrumentsRecording({ recordingPath, samplingInterval }) {
    const promises = this._allRunnableApps().map((app) => app.startInstrumentsRecording({ recordingPath, samplingInterval }));
    return Promise.all(promises);
  }

  async stopInstrumentsRecording() {
    const promises = this._allRunnableApps().map((app) => app.stopInstrumentsRecording());
    return Promise.all(promises);
  }

  async takeScreenshot(name) {
    if (!name) {
      throw new DetoxRuntimeError({ message: 'Cannot take a screenshot with an empty name.' });
    }
    return this._driver.takeScreenshot(name);
  }

  async setBiometricEnrollment(yesOrNo) {
    await this._driver.setBiometricEnrollment(yesOrNo);
  }

  async shake() {
    await this._driver.shake();
  }

  async setStatusBar(params) {
    return this._driver.setStatusBar(params);
  }

  async resetStatusBar(params) {
    return this._driver.resetStatusBar(params);
  }

  async reverseTcpPort(port) {
    await this._driver.reverseTcpPort(port);
  }

  async unreverseTcpPort(port) {
    await this._driver.unreverseTcpPort(port);
  }

  async clearKeychain() {
    await this._driver.clearKeychain();
  }

  async typeText(text) {
    await this._driver.typeText(text);
  }

  async _initApps() {
    await forEachSeries(this._allApps(), (app) => app.init(), this);
  }

  _allApps() {
    return [...Object.values(this._predefinedApps), this._unspecifiedApp, ...this._utilApps];
  }

  _allRunnableApps() {
    return [...Object.values(this._predefinedApps), this._unspecifiedApp];
  }
}

module.exports = RuntimeDevice;
