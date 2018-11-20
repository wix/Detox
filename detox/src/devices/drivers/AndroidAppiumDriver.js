/**
 * Created by Or Evron on 07/08/2018
 */
const AppiumDriverBase = require("./AppiumDriverBase");
const DetoxApi = require("../../android/espressoapi/Detox");
const EspressoDetoxApi = require("../../android/espressoapi/EspressoDetox");
const AAPT = require("../android/AAPT");
const {interruptProcess} = require("../../utils/exec");

class AndroidAppiumDriver extends AppiumDriverBase {
    constructor(client) {
        super(client);
        client = client.client;
        this.expect = require("../../android/expect");
        this.expect.setInvocationManager(this.invocationManager);
        this.aapt = new AAPT();
        var conf = {
            clearSystemFiles: true,
            allowTestPackages: true,
            noResetValue: true,
            idleTimeout: 1000,
            appPackage: 'launcher.detox.wix.com.detoxlauncher',
            appActivity: "MainActivity",
            otherApps: JSON.stringify([client.configuration.appium.desiredCapabilities.app, client.configuration.appium.desiredCapabilities.androidTestApp]),
            optionalIntentArguments: `--es detoxServer ${client.configuration.server} --es detoxSessionId ${client.configuration.sessionId} --es packageName ${client.configuration.appium.desiredCapabilities.bundleId}.test`
        };
        this._desiredCapabilities = Object.assign(this._desiredCapabilities, conf);
        this._desiredCapabilities.app = client.configuration.appium.desiredCapabilities.androidLauncher;
    }

    async getBundleIdFromBinary(binaryPath) {
        return this._bundleId;
    }

    async uninstallApp(deviceId, bundleId) {
        await this._driver.removeAppFromDevice(`${this._bundleId}`);
    }

    async installApp(deviceId, binaryPath, testBinaryPath) {
        await this._driver.installApp(JSON.parse(this._desiredCapabilities.otherApps)[0]);
        await this._driver.launchApp();
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
        await this._driver.quit();
        await this.terminateInstrumentation();
    }

    async terminateInstrumentation() {
        if (this.instrumentationProcess) {
            await interruptProcess(this.instrumentationProcess);
            this.instrumentationProcess = null;
        }
    }

    defaultLaunchArgsPrefix() {
        return "-e ";
    }

    exportGlobals() {
        this.expect.exportGlobals(this._driver);
    }
}

module.exports = AndroidAppiumDriver;