/**
 * Created by Or Evron on 07/08/2018
 */
const invoke = require('../../invoke');
const _ = require('lodash');
const path = require('path');
const InvocationManager = invoke.InvocationManager;
const GREYConfigurationApi = require('../../ios/earlgreyapi/GREYConfiguration');
const GREYConfigurationDetox = require('../../ios/earlgreyapi/GREYConfigurationDetox');
const EarlyGreyImpl = require('../../ios/earlgreyapi/EarlGreyImpl');
const AppiumDriverBase = require('./AppiumDriverBase');

class IosAppiumDriver extends AppiumDriverBase {
    constructor(client) {
        super(client);
        client = client.client;
        this.expect = require('../../ios/expect');
        this.invocationManager = new InvocationManager(client);
        this.expect.setInvocationManager(this.invocationManager);
        var conf = {
            waitForQuiescence: false,
            processArguments: {args: ['-detoxServer', client.configuration.server, '-detoxSessionId', client.configuration.sessionId]}
        };
        this._desiredCapabilities = Object.assign(this._desiredCapabilities, conf);
    }

    async getBundleIdFromBinary(appPath) {
        return this._bundleId;
    }

    async uninstallApp() {
        await this._driver.removeAppFromDevice(`${this._bundleId}`);
    }

    async installApp() {
        await this._driver.installApp(this._desiredCapabilities.app);
        //resetApp is required to refresh the rendering of the app.
        await this._driver.resetApp();
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
        const call = EarlyGreyImpl.rotateDeviceToOrientationErrorOrNil(invoke.EarlGrey.instance, orientation);
        await this.client.execute(call);
    }

    defaultLaunchArgsPrefix() {
        return '-';
    }
}

module.exports = IosAppiumDriver;