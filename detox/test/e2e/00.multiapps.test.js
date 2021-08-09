const { device } = require('detox');
const sleep = require('../../src/utils/sleep');

const switchToApp = () => device.launchApp({ newInstance: false });

describe('Multi-apps sandbox', () => {

  // afterEach(() => console.log('going to sleep in between tests...') || sleep(10000))

  it('should', async () => {
    await selectApp('example');
    await device.launchApp({ newInstance: false });
    await device.reloadReactNative();
    await element(by.text('Sanity')).tap();
    await expect(element(by.text('Welcome'))).toBeVisible();

    await selectApp('example-demo');
    await device.launchApp({ newInstance: false });
    await expect(element(by.text('Welcome'))).toBeVisible();
    await element(by.text('Say Hello')).tap();
    await expect(element(by.text('Hello!!!'))).toBeVisible();

    await selectApp('example');
    await switchToApp();
    await device.reloadReactNative();
    await element(by.text('Sanity')).tap();
  });

  it('should should', async () => {
    await selectApp('example-demo');
    await device.launchApp({ newInstance: false });
    // await device.reloadReactNative();
    // await expect(element(by.text('Welcome'))).toBeVisible();
    // await element(by.text('Say Hello')).tap();
    await expect(element(by.text('Hello!!!'))).toBeVisible();
  });
});
