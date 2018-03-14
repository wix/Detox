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

  it.only('Foreground push notifications', async () => {
    await device.launchApp({newInstance: true});
    await device.sendUserNotification(userNotificationCalendarTrigger);
    await expect(element(by.text('From calendar'))).toBeVisible();
  });

  it('Foreground calendar notifications', async () => {
    await device.launchApp({newInstance: true});
    await device.sendUserNotification(userNotificationCalendarTrigger);
    await expect(element(by.text('From calendar'))).toBeVisible();
  });
});

const userNotificationPushTrigger = {
  "trigger": {
    "type": "push"
  },
  "title": "From push",
  "subtitle": "Subtitle",
  "body": "Body",
  "badge": 1,
  "payload": {
    "key1": "value1",
    "key2": "value2"
  },
  "category": "com.example.category",
  "content-available": 0,
  "action-identifier": "default"
};

const userNotificationCalendarTrigger = {
  "trigger": {
    "type": "calendar",
    "date-components": {
      "era": 1,
      "year": 2017,
      "month": 1,
      "day": 1,
      "hour": 0,
      "minute": 0,
      "second": 0,
      "weekday": 0,
      "weekdayOrdinal": 0,
      "quarter": 1,
      "weekOfMonth": 1,
      "weekOfYear": 1,
      "leapMonth": false
    },
    "repeats": true
  },
  "title": "From calendar",
  "subtitle": "Subtitle",
  "body": "From calendar",
  "badge": 1,
  "payload": {
    "key1": "value1",
    "key2": "value2"
  },
  "category": "com.example.category",
  "user-text": "Hi there!",
  "content-available": 0,
  "action-identifier": "default"
};
