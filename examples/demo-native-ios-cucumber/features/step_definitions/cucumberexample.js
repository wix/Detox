const {Given} = require('cucumber');
const {beforeEach, device} = require('detox');

beforeEach(async () => {
    await device.relaunchApp();
  });

Given('I should have welcome screen', async () => {
    await expect(element(by.text('Welcome'))).toBeVisible();
    await expect(element(by.text('Say Hello'))).toBeVisible();
    await expect(element(by.text('Say World'))).toBeVisible();
  });

Given('I should show hello screen after tap', async () => {
    await element(by.text('Say Hello')).tap();
    await expect(element(by.text('Hello!!!'))).toBeVisible();
});

Given('I should show world screen after tap', async () => {
    await element(by.text('Say World')).tap();
    await expect(element(by.text('World!!!'))).toBeVisible();
});