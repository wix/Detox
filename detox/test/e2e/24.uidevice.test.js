  describe(':android: UIDevice', () => {
    beforeEach(async() => {
      await device.reloadReactNative();
    });

    it(`:android: device.getUiDevice() + getDisplayHeight() + getDisplayWidth() + click()`, async () => {
      await element(by.text('Device')).tap();
      const uiDevice = device.getUiDevice();
      const height = await uiDevice.getDisplayHeight();
      const width = await uiDevice.getDisplayWidth();
      await uiDevice.click(width / 2, height / 2);
      await expect(element(by.text('Tap works'))).toBeVisible();
    });
});
