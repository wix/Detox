const {
  userNotificationPushTrigger,
  userNotificationCalendarTrigger,
} = require('./utils/notifications');

describe(':ios: User Notifications', () => {
  it('Init from push notification', async () => {
    await device.launchApp({newInstance: true, userNotification: userNotificationPushTrigger});
    await expect(element(by.text('From push'))).toBeVisible();
  });

  xit('Init from calendar notification', async () => {
    await device.launchApp({newInstance: true, userNotification: userNotificationCalendarTrigger});
    await expect(element(by.text('From calendar'))).toBeVisible();
  });

  it('Background push notification', async () => {
    await device.launchApp({newInstance: true});
    await device.sendToHome();
    await device.launchApp({newInstance: false, userNotification: userNotificationPushTrigger});
    await expect(element(by.text('From push'))).toBeVisible();
  });

  it('Background calendar notification', async () => {
    await device.launchApp({newInstance: true});
    await device.sendToHome();
    await device.launchApp({newInstance: false, userNotification: userNotificationCalendarTrigger});
    await expect(element(by.text('From calendar'))).toBeVisible();
  });

  it('Foreground push notifications', async () => {
    await device.launchApp({newInstance: true});
    await device.sendUserNotification(userNotificationPushTrigger);
    await expect(element(by.text('From push'))).toBeVisible();
  });

  it('Foreground calendar notifications', async () => {
    await device.launchApp({newInstance: true});
    await device.sendUserNotification(userNotificationCalendarTrigger);
    await expect(element(by.text('From calendar'))).toBeVisible();
  });
});

describe(':android: User Notifications', () => {
  async function assertNotificationData(key, expectedValue) {
    await expect(element(by.id(`notificationData-${key}.name`))).toBeVisible();
    await expect(element(by.id(`notificationData-${key}.value`))).toHaveText(expectedValue);
  }

  it('should launch app with extras', async () => {
    const googleProjectId = 284440699462;
    const userNotification = {
      from: googleProjectId,
      userData: 'userDataValue',
      userDataArray: ['rock', 'paper', 'scissors'],
      'google.sent_time': 1592133826891,
      'google.ttl': 2419200,
      'google.original_priority': 'high',
      'collapse_key': 'com.wix.reactnativenotifications.app',
    };
    await device.launchApp({ newInstance: true, userNotification });
    await element(by.text('Launch-Notification')).tap();
    await expect(element(by.text('Launch-notification Data'))).toBeVisible();
    await assertNotificationData('from', googleProjectId.toString());
    await assertNotificationData('userData', userNotification.userData);
    await assertNotificationData('userDataArray', JSON.stringify(userNotification.userDataArray));
  });
});
