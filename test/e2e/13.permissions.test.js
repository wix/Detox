describe(':ios: Permissions', () => {

  it('Permissions is granted', async () => {
    await device.launchApp({permissions: {calendar: 'YES'}, newInstance: true});
    await element(by.text('Permissions')).tap();
    await expect(element(by.text('granted'))).toBeVisible();
  });

  it('Permissions denied', async () => {
    await device.launchApp({permissions: {calendar: 'NO'}, newInstance: true});
    await element(by.text('Permissions')).tap();
    await expect(element(by.text('denied'))).toBeVisible();
  });
});