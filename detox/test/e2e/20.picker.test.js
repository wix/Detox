describe(':ios: Picker', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
      await element(by.text('Picker')).tap();
    });

  it('picker should trigger change handler correctly using testID', async () => {
    await expect(element(by.id('FooLabel'))).toHaveText('Foo')

    await element(by.id('FooPicker')).setColumnToValue(0, 'Bar');

    await expect(element(by.id('FooLabel'))).toHaveText('Bar')
  });

  it('picker should trigger change handler correctly using type', async () => {
    await expect(element(by.id('FooLabel'))).toHaveText('Foo')

    await element(by.type('UIPickerView')).setColumnToValue(0, 'Bar');

    await expect(element(by.id('FooLabel'))).toHaveText('Bar')
  });
});
