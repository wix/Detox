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
        this._url = client.configuration.appium.url;
        this.invocationManager = new InvocationManager(client);
        this._desiredCapabilities = Object.assign({
                name: "detox",
            },
            client.configuration.appium.desiredCapabilities || {});
    }

    validateDeviceConfig(config) {
        this.deviceConfig = config;
    }

    async prepare(deviceConfig) {
        this._driver = await wd.promiseRemote(this._url);
        console.log(this._desiredCapabilities)
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
        // this function is called last in the sequence so the app staying closed before test starts
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