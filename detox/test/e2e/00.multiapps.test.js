const { device } = require('detox');
const sleep = require('../../src/utils/sleep');

const switchToApp = () => device.launchApp({ newInstance: false });

describe('Multi-apps sandbox', () => {

  // afterEach(() => console.log('going to sleep in between tests...') || sleep(10000))

  it.skip('should follow flows', async () => {
    await selectApp('example');
    await device.launchApp({ newInstance: false });
    await element(by.text('Sanity')).tap();
    await expect(element(by.text('Welcome'))).toBeVisible();

    console.log('Now is the time to manually launch example-demo...');
    await sleep(5000);
    await selectApp('example-demo');
    await expect(element(by.text('Welcome'))).toBeVisible();
    await element(by.text('Say Hello')).tap();
    await expect(element(by.text('Hello!!!'))).toBeVisible();

    await selectApp('example');
    await switchToApp();
    await expect(element(by.text('Welcome'))).toBeVisible();
  });

  it('should', async () => {
    await selectApp('example');
    await device.launchApp({ newInstance: true });
    await device.reloadReactNative();
    await element(by.text('Sanity')).tap();
    await expect(element(by.text('Welcome'))).toBeVisible();

    await selectApp('example-demo');
    await device.launchApp({ newInstance: true });
    await expect(element(by.text('Welcome'))).toBeVisible();
    await element(by.text('Say Hello')).tap();
    await expect(element(by.text('Hello!!!'))).toBeVisible();

    await selectApp('example');
    await switchToApp();
    await device.reloadReactNative();
    await element(by.text('Sanity')).tap();
  });

  it('should more', async () => {
    await selectApp('example-demo');
    await device.launchApp({ newInstance: true });
    // await device.reloadReactNative();
    await expect(element(by.text('Welcome'))).toBeVisible();
    await element(by.text('Say Hello')).tap();
    await expect(element(by.text('Hello!!!'))).toBeVisible();
  });
});
