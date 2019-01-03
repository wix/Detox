/**
 * Created by Or Evron on 06/08/2018
 */
const wd = require('wd');
const invoke = require('../../invoke');
const InvocationManager = invoke.InvocationManager;
const DeviceDriverBase = require('./DeviceDriverBase');
const fs = require('fs');
const path = require('path');

class AppiumDriverBase extends DeviceDriverBase {
    constructor(client) {
        super(client);
        client = client.client;
        this.invocationManager = new InvocationManager(client);
        if (!client.configuration.appium) {
            client.configuration.appium = {};
        }
        this._url = client.configuration.appium.url;
        this._desiredCapabilities = Object.assign({
            name: "detox",
            appiumVersion: "1.9.1",
            newCommandTimeout: 60000,
            idleTimeout: 1000,
        }, client.configuration.appium.desiredCapabilities || {});
        this._bundleId = this._desiredCapabilities.bundleId;
    }

    validateDeviceConfig(config) {
        // using validateDeviceConfig to get access to the user configuration
        this.deviceConfig = config;
        if (config.appium) {
            this._url = this._url || config.appium.url;
            this._desiredCapabilities = Object.assign(config.appium.desiredCapabilities || {}, this._desiredCapabilities);
            this._bundleId = this._desiredCapabilities.bundleId;
        }
        if (!this._url) {
            throw new Error('missing appium url');
        }
        if (!this._bundleId) {
            throw new Error('missing app bundleId');
        }
    }

    async prepare() {
        this._driver = await wd.promiseRemote(this._url);
        await this._driver.init(this._desiredCapabilities);
        global.appium = this._driver;
    }

    async acquireFreeDevice(name) {
        return 'appium';
    }

    createPayloadFile(notification) {
        const notificationFilePath = path.join(this.createRandomDirectory(), `payload.json`);
        fs.writeFileSync(notificationFilePath, JSON.stringify(notification, null, 2));
        return notificationFilePath;
    }

    async launch() {
        await this._driver.launchApp();
    }

    async terminate() {
        // Terminate function is not implemented due to bizarre behavior
        // await this._driver.closeApp();
    }

    async sendToHome() {
        await this._driver.sendKeys(82);
    }

    async shake() {
        await this._driver.shake();
    }

    async shutdown() {
        await this._driver.quit();
    }

    async getPlatform() {
        return this._desiredCapabilities.platformName;
    }
}

module.exports = AppiumDriverBase;