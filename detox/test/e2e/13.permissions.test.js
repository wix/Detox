const { RESULTS } = require('react-native-permissions');

const CALENDAR_AUTHORIZATION_STATUS = 'calendar_authorization_status';

describe(':ios: Permissions', () => {
  describe('Calendar', () => {
    const calendarAuthorizationStatus = element(by.id(CALENDAR_AUTHORIZATION_STATUS));

    it('should show default permissions when undefined', async () => {
      await device.launchApp({newInstance: true});
      await element(by.text('Permissions')).tap();
      await expect(calendarAuthorizationStatus).toHaveText(RESULTS.DENIED);
    });

    it('should show default permissions when defined to `unset`', async () => {
      await device.launchApp({permissions: {calendar: 'unset'}, newInstance: true});
      await element(by.text('Permissions')).tap();
      await expect(calendarAuthorizationStatus).toHaveText(RESULTS.DENIED);
    });

    it('should grant permission', async () => {
      await device.launchApp({permissions: {calendar: 'YES'}, newInstance: true});
      await element(by.text('Permissions')).tap();
      await expect(calendarAuthorizationStatus).toHaveText(RESULTS.GRANTED);
    });

    it('should block permissions', async () => {
      await device.launchApp({permissions: {calendar: 'NO'}, newInstance: true});
      await element(by.text('Permissions')).tap();
      await expect(calendarAuthorizationStatus).toHaveText(RESULTS.BLOCKED);
    });
  });
});

