/**
 * Created by Or Evron on 07/08/2018
 */
const wd = require('wd');
const invoke = require('../invoke');
const GREYConfigurationApi = require('./../ios/earlgreyapi/GREYConfiguration');
const GREYConfigurationDetox = require('./../ios/earlgreyapi/GREYConfigurationDetox');
const EarlyGrey = require('./../ios/earlgreyapi/EarlGrey');
const AppiumDriverBase = require('./AppiumDriverBase');

class IosAppiumDriver extends AppiumDriverBase {
    constructor(client) {
        super(client);
        this.expect = require('../ios/expect');
        this._desiredCapabilities = Object.assign({
            name: "detox",
            clearSystemFiles: true,
            waitForQuiescence: false,
            processArguments: {args: ['-detoxServer', client.configuration.server, '-detoxSessionId', client.configuration.sessionId]}
        }, client.configuration.appium.desiredCapabilities || {});
    }

    async prepare() {
        this._driver = await wd.promiseRemote(this._url);
        await this._driver.init(this._desiredCapabilities);
    }

    async uninstallApp() {
        await this._driver.removeAppFromDevice(this.bundleId);
    }

    async installApp() {
        await this._driver.installApp(this._desiredCapabilities.app);
    }

    exportGlobals() {
        this.expect.exportGlobals();
    }

    async setURLBlacklist(urlList) {
        await this.client.execute(GREYConfigurationApi.setValueForConfigKey(invoke.callDirectly(GREYConfigurationApi.sharedInstance()), urlList, "GREYConfigKeyURLBlacklistRegex"));
    }

    async enableSynchronization() {
        await this.client.execute(GREYConfigurationDetox.enableSynchronization(invoke.callDirectly(GREYConfigurationApi.sharedInstance())));
    }

    async disableSynchronization() {
        await this.client.execute(GREYConfigurationDetox.disableSynchronization(invoke.callDirectly(GREYConfigurationApi.sharedInstance())));
    }

    async setOrientation(deviceId, orientation) {
        const call = EarlyGrey.rotateDeviceToOrientationErrorOrNil(invoke.EarlGrey.instance, orientation);
        await this.client.execute(call);
    }

    defaultLaunchArgsPrefix() {
        return '-';
    }

    validateDeviceConfig(config) {
        //no validation
    }
}

module.exports = IosAppiumDriver;