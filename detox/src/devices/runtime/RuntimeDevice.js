const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
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
  }

  async init() {
    const appAliases = Object.keys(this._predefinedApps);
    if (appAliases.length === 1) {
      const appAlias = appAliases[0];
      this._selectedApp = this._predefinedApps[appAlias];
    }

    await this._initApps();
  }

  /**
   * @returns { RunnableTestApp }
   */
  get selectedApp() {
    return this._selectedApp;
  }

  get id() {
    return this._driver.getExternalId();
  }

  get name() {
    return this._driver.getDeviceName();
  }

  get platform() {
    return this._driver.platform();
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
    this._selectedApp.select();
  }

  async selectUnspecifiedApp(appConfig) {
    if (this._selectedApp) {
      await this._selectedApp.deselect();
    }

    this._selectedApp = this._unspecifiedApp;
    await this._selectedApp.select(appConfig);
  }

  async installUtilBinaries() {
    await traceCall('installUtilBinaries', () => {
      forEachSeries(this._utilApps, (app) => app.install(), this);
    });
  }

  async reinstallApps(appAliases) {
    for (const appAlias of appAliases) {
      const app = this._predefinedApps[appAlias];
      await app.uninstall();
      await app.install();
    }
  }

  async takeScreenshot(name) {
    if (!name) {
      throw new DetoxRuntimeError({ message: 'Cannot take a screenshot with an empty name.' });
    }
    return this._driver.takeScreenshot(name);
  }

  async captureViewHierarchy(name) {
    return this._driver.captureViewHierarchy(name);
  }

  async sendToHome() {
    await this._driver.sendToHome();
  }

  async pressBack() {
    await this._driver.pressBack();
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

  async setLocation(lat, lon) {
    lat = String(lat);
    lon = String(lon);
    await this._driver.setLocation(lat, lon);
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

  async _initApps() {
    await forEachSeries(this._allApps(), (app) => app.init(), this);
  }

  _allApps() {
    return [...Object.values(this._predefinedApps), this._unspecifiedApp, ...this._utilApps];
  }
}

module.exports = RuntimeDevice;
