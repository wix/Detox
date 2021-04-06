const { forEachSeries } = require('p-iteration');

describe(':android: UIDevice', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it(`device.getUiDevice() + getDisplayHeight() + getDisplayWidth() + click()`, async () => {
    await element(by.text('Device')).tap();
    const uiDevice = device.getUiDevice();
    const height = await uiDevice.getDisplayHeight();
    const width = await uiDevice.getDisplayWidth();
    await uiDevice.click(width / 2, height / 2);
    await expect(element(by.text('Tap works'))).toBeVisible();
  });

  it(`should type in an element using pressKeyCode()`, async () => {
    const text = "a1b2c3";
    const textAsCodes = [29, 8, 30, 9, 31, 10];
    const uiDevice = device.getUiDevice();

    await element(by.text('Actions')).tap();
    await element(by.id('UniqueId937')).tap();
    await forEachSeries(textAsCodes, (keyCode) => uiDevice.pressKeyCode(keyCode));
    await expect(element(by.text(text))).toBeVisible();
  });
});
