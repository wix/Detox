const CALENDAR_AUTHORIZATION_STATUS = 'calendar_authorization_status';
const NOTIFICATION_AUTHORIZATION_STATUS = 'notification_authorization_status';

describe(':ios: Permissions', () => {
  describe('Calendar', () => {
    const calendarAuthorizationStatus = element(by.id(CALENDAR_AUTHORIZATION_STATUS));

    it('should show default permissions', async () => {
      await device.launchApp({newInstance: true});
      await element(by.text('Permissions')).tap();
      await expect(calendarAuthorizationStatus).toHaveText('denied');
    });

    it('should show default permissions when unset', async () => {
      await device.launchApp({permissions: {calendar: 'unset'}, newInstance: true});
      await element(by.text('Permissions')).tap();
      await expect(calendarAuthorizationStatus).toHaveText('denied');
    });

    it('should grant permission', async () => {
      await device.launchApp({permissions: {calendar: 'YES'}, newInstance: true});
      await element(by.text('Permissions')).tap();
      await expect(calendarAuthorizationStatus).toHaveText('granted');
    });

    it('should deny permissions', async () => {
      await device.launchApp({permissions: {calendar: 'NO'}, newInstance: true});
      await element(by.text('Permissions')).tap();
      await expect(calendarAuthorizationStatus).toHaveText('denied');
    });
  });
});

