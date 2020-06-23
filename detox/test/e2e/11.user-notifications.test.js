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
  const googleProjectId = 284440699462;
  const userNotification = {
    payload: {
      from: googleProjectId,
      userData: 'userDataValue',
      userDataArray: ['rock', 'paper', 'scissors'],
      'google.sent_time': 1592133826891,
      'google.ttl': 2419200,
      'google.original_priority': 'high',
      'collapse_key': 'com.wix.detox.test',
    },
  };

  async function assertNotificationDataField(key, expectedValue) {
    await expect(element(by.id(`notificationData-${key}.name`))).toBeVisible();
    await expect(element(by.id(`notificationData-${key}.value`))).toHaveText(expectedValue);
  }

  async function assertNotificationDataExtensively() {
    await assertNotificationDataField('from', googleProjectId.toString());
    await assertNotificationDataField('userData', userNotification.payload.userData);
    await assertNotificationDataField('userDataArray', JSON.stringify(userNotification.payload.userDataArray));
  }

  async function assertNotificationData() {
    await assertNotificationDataField('userData', userNotification.payload.userData);
  }

  it('should launch app with data', async () => {
    await device.launchApp({ newInstance: true, userNotification });
    await element(by.text('Launch-Notification')).tap();
    await assertNotificationDataExtensively();
  });

  it('should resume app with data', async () => {
    await device.launchApp({ newInstance: true });
    console.log('Sending app to background...');
    await device.sendToHome();
    console.log('Resuming app with user notification');
    await device.launchApp({ newInstance: false, userNotification });
    await element(by.text('Launch-Notification')).tap();
    await assertNotificationData();
  });

  it('should apply notification using sendUserNotification() when app is running', async () => {
    await device.launchApp({newInstance: true});
    await device.sendUserNotification(userNotification);
    await element(by.text('Launch-Notification')).tap();
    await assertNotificationData();
  });
});
