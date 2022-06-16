const DetoxRuntimeError = require('../../errors/DetoxRuntimeError');
const { traceCall } = require('../../utils/trace');

const LaunchArgsEditor = require('./utils/LaunchArgsEditor');

class TestApp {
  /**
   * @param driver { TestAppDriver }
   */
  constructor(driver) {
    this._driver = driver;
  }

  async init() {}

  async install() {
    await traceCall('appInstall', () => this._driver.install());
  }

  async uninstall() {
    await traceCall('appUninstall', () => this._driver.uninstall());
  }
}

class RunnableTestApp extends TestApp {
  constructor(driver, { appConfig, behaviorConfig }) {
    super(driver);

    this.appConfig = appConfig;
    this.behaviorConfig = behaviorConfig;

    this._launchArgs = new LaunchArgsEditor();
  }

  get launchArgs() {
    return this._launchArgs;
  }

  async init() {
    this._driver.setOnDisconnectListener(this._onDisconnect.bind(this));

    await this._driver.init();
  }

  get alias() {
    return null;
  }

  get uiDevice() {
    return this._driver.uiDevice;
  }

  async select() {
    this._launchArgs.reset();
    this._launchArgs.modify(this.appConfig.launchArgs);
  }

  async deselect() {
    await this._driver.deselect();
  }

  async launch(launchInfo) {
    return traceCall('launchApp', () => this._launch(launchInfo));
  }

  async reloadReactNative() {
    return this._driver.reloadReactNative();
  }

  async enableSynchronization() {
    await this._driver.enableSynchronization();
  }

  async disableSynchronization() {
    await this._driver.disableSynchronization();
  }

  async openURL(params) {
    if (typeof params !== 'object' || !params.url) {
      throw new DetoxRuntimeError({ message: `openURL must be called with JSON params, and a value for 'url' key must be provided. See https://wix.github.io/Detox/docs/api/device-object-api/#deviceopenurlurl-sourceappoptional.` });
    }
    await this._driver.deliverPayload(params);
  }

  async sendUserActivity(payload) {
    await this._driver.sendUserActivity(payload);
  }

  async sendUserNotification(payload) {
    await this._driver.sendUserNotification(payload);
  }

  async setURLBlacklist(urlList) {
    await this._driver.setURLBlacklist(urlList);
  }

  async resetContentAndSettings() {
    await this._driver.resetContentAndSettings();
  }

  async matchFace() {
    await this._driver.matchFace();
  }

  async unmatchFace() {
    await this._driver.unmatchFace();
  }

  async matchFinger() {
    await this._driver.matchFinger();
  }

  async unmatchFinger() {
    await this._driver.unmatchFinger();
  }

  async shake() {
    await this._driver.shake();
  }

  async sendToHome() {
    await this._driver.sendToHome();
  }

  async pressBack() {
    await this._driver.pressBack();
  }

  async setOrientation(orientation) {
    await this._driver.setOrientation(orientation);
  }

  async terminate() {
    await traceCall('appTerminate', () => this._driver.terminate());
  }

  async cleanup() {
    await traceCall('appCleanup', () => this._driver.cleanup());
  }

  // TODO (multiapps) Effectively, this only provides an abstraction over the means by which invocation is implemented.
  //  If we are to push further in order to get a real inter-layer separation and abstract away the whole means by
  //  which the various expectations are performed altogether, we must in fact extend the entity model slightly further and create
  //  a TestApp equivalent for matching, with an equivalent driver. Something like:
  //    TestAppExpect -> A class that would hold a copy of invocationManager, with methods such as tap() and expectVisible()
  //    TestAppExpectDriver -> A delegate that would generate the proper invocation for tap(), expectVisible(), etc., depending on
  //                           the platform (iOS / Android).
  async invoke(action) {
    return this._driver.invoke(action);
  }

  // TODO (multiapps) Similar to the notes about invoke(), these artifacts-related methods should probably reside
  //  under a TestApp equivalent which is strictly associated with artifacts. It should be accompanied by a driver. For example:
  //    TestAppArtifacts -> The equivalent class
  //    TestAppArtifactsDriver -> The driver delegate
  //  In this case, most likely, an additional change is required: recordingPath should stem from the driver, rather than from
  //  the top-most layer (i.e. our caller).

  setInvokeFailuresListener(listener) {
    this._driver.setInvokeFailuresListener(listener);
  }

  async startInstrumentsRecording({ recordingPath, samplingInterval }) {
    return this._driver.startInstrumentsRecording({ recordingPath, samplingInterval });
  }

  async stopInstrumentsRecording() {
    return this._driver.stopInstrumentsRecording();
  }

  async _onDisconnect() {
    if (this._driver.isRunning()) {
      await this.terminate();
    }
  }

  async _launch(launchParams) {
    const payloadParams = ['url', 'userNotification', 'userActivity'];
    const hasPayload = this._assertHasSingleParam(payloadParams, launchParams);
    const isRunning = this._driver.isRunning();
    const newInstance = (launchParams.newInstance !== undefined)
      ? launchParams.newInstance
      : !isRunning;

    if (launchParams.delete) {
      await this._driver.terminate();
      await this._driver.uninstall();
      await this._driver.install();
    } else if (newInstance) {
      await this._driver.terminate();
    }

    if (launchParams.permissions) {
      await this._driver.setPermissions(launchParams.permissions);
    }

    const launchArgs = this._prepareLaunchArgs(launchParams);

    if (isRunning && hasPayload) {
      // TODO (multiapps) Is this really needed, provided that the payload gets inject via the launch args?
      await this._driver.deliverPayload({ ...launchParams, delayPayload: true });
    }

    const launchInfo = {
      launchArgs,
      languageAndLocale: launchParams.languageAndLocale,
    };

    if (this.behaviorConfig.launchApp === 'manual') {
      await this._driver.waitForLaunch(launchInfo);
    } else {
      await this._driver.launch(launchInfo);
    }

  }

  _assertHasSingleParam(singleParams, params) {
    let paramsCounter = 0;

    singleParams.forEach((item) => {
      if(params[item]) {
        paramsCounter += 1;
      }
    });

    if (paramsCounter > 1) {
      throw new DetoxRuntimeError({ message: `Call to 'launchApp(${JSON.stringify(params)})' must contain only one of ${JSON.stringify(singleParams)}.` });
    }
    return (paramsCounter === 1);
  }

  _prepareLaunchArgs(launchInfo) {
    const launchArgs = {
      ...this._launchArgs.get(),
      ...launchInfo.launchArgs,
    };

    if (launchInfo.url) {
      launchArgs.detoxURLOverride = launchInfo.url;

      if (launchInfo.sourceApp) {
        launchArgs.detoxSourceAppOverride = launchInfo.sourceApp;
      }
    } else if (launchInfo.userNotification) {
      launchArgs.detoxUserNotificationDataURL = launchInfo.userNotification;
      delete launchInfo.userNotification; // TODO (multiapps) revisit whether this is needed
    } else if (launchInfo.userActivity) {
      launchArgs.detoxUserActivityDataURL = launchInfo.userActivity;
      delete launchInfo.userActivity;  // TODO (multiapps) revisit whether this is needed
    }

    if (launchInfo.disableTouchIndicators) {
      launchArgs.detoxDisableTouchIndicators = true;
    }
    return launchArgs;
  }
}

class PredefinedTestApp extends RunnableTestApp {
  constructor(driver, configs, alias) {
    super(driver, configs);

    this._alias = alias;
  }

  /** @override */
  get alias() {
    return this._alias;
  }

  async select() {
    await super.select();
    await this._driver.select(this.appConfig);
  }
}

class UnspecifiedTestApp extends RunnableTestApp {
  constructor(driver, { behaviorConfig }) {
    super(driver, { behaviorConfig, appConfig: {}  });
  }

  async select(appConfig) {
    if (!appConfig) {
      throw new DetoxRuntimeError({ message: 'Please provide an appConfig argument in order to select this app' });
    }
    this.appConfig = appConfig;

    await super.select();
    await this._driver.select(this.appConfig);
  }
}

class UtilApp extends TestApp {
  constructor(driver, { appConfig }) {
    super(driver);

    this._appConfig = appConfig;
  }

  async init() {
    await this._driver.select(this._appConfig);
  }
}

module.exports = {
  PredefinedTestApp,
  UnspecifiedTestApp,
  UtilApp,
};
