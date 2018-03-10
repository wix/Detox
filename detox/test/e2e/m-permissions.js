describe(':ios: Permissions', () => {

  it('Permissions is granted', async () => {
    await device.launchApp({permissions: {calendar: 'YES'}});
    await element(by.text('Permissions')).tap();
    await expect(element(by.text('granted'))).toBeVisible();
  });

  it('Permissions denied', async () => {
    await device.launchApp({permissions: {calendar: 'NO'}});
    await element(by.text('Permissions')).tap();
    await expect(element(by.text('denied'))).toBeVisible();
  });
});