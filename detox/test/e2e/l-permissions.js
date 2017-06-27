describe.only('Permissions', () => {

    it('Permissions is granted', async() => {
        await device.relaunchApp({permissions:{calendar: 'YES'}});
        await element(by.label('Permissions')).tap();
        await expect(element(by.text('granted'))).toBeVisible();
    });

    it('Permissions denied', async() => {
        await device.relaunchApp({permissions:{calendar: 'NO'}});
        await element(by.label('Permissions')).tap();
        await expect(element(by.text('denied'))).toBeVisible();
    });
});