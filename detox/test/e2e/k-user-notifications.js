describe('User Notifications', () => {

  describe('Background push notification', () => {
    beforeEach((done) => {
      simulator.relaunchApp({userNotification: userNotificationPushTrigger}, done)
    });

    it('push notification from background', () => {
      expect(element(by.label('From push'))).toBeVisible();
    });
  });

  describe('Foreground user notifications', () => {

    beforeEach((done) => {
      simulator.relaunchApp(done);
    });

    it('local notification from inside the app', (done) => {
      simulator.sendUserNotification(userNotificationCalendarTrigger, () => {
        expect(element(by.label('From calendar'))).toBeVisible();
        done();
      });
    });
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
