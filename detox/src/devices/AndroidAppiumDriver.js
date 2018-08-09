/**
 * Created by Or Evron on 07/08/2018
 */
const wd = require('wd');
const interruptProcess = require('../utils/interruptProcess');
const DetoxApi = require('../android/espressoapi/Detox');
const EspressoDetoxApi = require('../android/espressoapi/EspressoDetox');
const AAPT = require('./android/AAPT');
const AppiumDriverBase = require('./AppiumDriverBase');

class AndroidAppiumDriver extends AppiumDriverBase {
    constructor(client) {
        super(client);
        this.expect = require('../android/expect');
        this.expect.setInvocationManager(this.invocationManager);
        this.aapt = new AAPT();
        this._desiredCapabilities = Object.assign({
            allowTestPackages: true,
            optionalIntentArguments: `--es detoxServer ${client.configuration.server} --es detoxSessionId ${client.configuration.sessionId}`,
            appPackage: this.getBundleIdFromBinary(client.configuration.appium.desiredCapabilities.app),
            appActivity: 'MainActivity',
        }, client.configuration.appium.desiredCapabilities || {});
        this.appPackage = (this._desiredCapabilities.appPackage.split('.')).pop();
    }

    async prepare() {
        this._driver = await wd.promiseRemote(this._url);
        await this._driver.init(this._desiredCapabilities, {launchApp: false});
    }

    async getBundleIdFromBinary(apkPath) {
        return this.aapt.getPackageName(apkPath);
    }

    async uninstallApp() {
        await this._driver.removeAppFromDevice(this.appPackage);
        await this._driver.removeAppFromDevice(`${this.appPackage}.test`);
        await this._driver.removeAppFromDevice(`${this.appPackage}.detox`);
    }

    async installApp() {
        await this._driver.installApp(this._desiredCapabilities.app);
        await this._driver.installApp(JSON.parse(this._desiredCapabilities.otherApps)[0]);
        await this._driver.installApp(JSON.parse(this._desiredCapabilities.otherApps)[1]);
    }

    async deliverPayload(params) {
        if (params.url) {
            const call = DetoxApi.startActivityFromUrl(params.url);
            await this.invocationManager.execute(call);
        }
    }

    async setURLBlacklist(urlList) {
        const call = EspressoDetoxApi.setURLBlacklist(urlList);
        await this.invocationManager.execute(call);
    }

    async enableSynchronization() {
        const call = EspressoDetoxApi.setSynchronization(true);
        await this.invocationManager.execute(call);
    }

    async disableSynchronization() {
        const call = EspressoDetoxApi.setSynchronization(false);
        await this.invocationManager.execute(call);
    }

    async cleanup(deviceId, bundleId) {
        await this.terminateInstrumentation();
    }

    async terminateInstrumentation() {
        if (this.instrumentationProcess) {
            await interruptProcess(this.instrumentationProcess);
            this.instrumentationProcess = null;
        }
    }

    defaultLaunchArgsPrefix() {
        return '-e ';
    }

    exportGlobals() {
        this.expect.exportGlobals();
    }
}

module.exports = AndroidAppiumDriver;