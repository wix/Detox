describe('User Notifications', () => {
  it('Init from user notification', async () => {
    await device.launchApp({newInstance:true, userNotification: userNotificationPushTrigger});
    await expect(element(by.label('From push'))).toBeVisible();
  });

  it('Background user notification', async () => {
    await device.launchApp({newInstance:true});
    await device.sendToHome();
    await device.launchApp({newInstance:false, userNotification: userNotificationCalendarTrigger});
    await expect(element(by.label('From calendar'))).toBeVisible();
  });

  it('Foreground user notifications - local notification from inside the app - async', async () => {
    await device.launchApp();
    await device.sendUserNotification(userNotificationCalendarTrigger);
    await expect(element(by.label('From calendar'))).toBeVisible();
  });

  it('Foreground user notifications - local notification from inside the app - promises + callback', (done) => {
    device.launchApp()
          .then(() => device.sendUserNotification(userNotificationCalendarTrigger)
          .then(() => expect(element(by.label('From calendar'))).toBeVisible()))
          .then(done);
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
