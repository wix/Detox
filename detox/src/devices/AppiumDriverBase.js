/**
 * Created by Or Evron on 06/08/2018
 */
const invoke = require('../invoke');
const InvocationManager = invoke.InvocationManager;
const fs = require('fs');
const path = require('path');
const DeviceDriverBase = require('./DeviceDriverBase');

class AppiumDriverBase extends DeviceDriverBase {
    constructor(client) {
        super(client);
        this._url = client.configuration.appium.url;
        this.invocationManager = new InvocationManager(client);
        this._desiredCapabilities = Object.assign({
                name: "detox",
                newCommandTimeout: 60000,
            },
            client.configuration.appium.desiredCapabilities || {});
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
        await this._driver.closeApp();
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