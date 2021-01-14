# Mocking User Notifications

Detox supports mocking user notifications.

>**Note:** The mocking mechanism will not mimic the UI of a user notification. Instead, it will only simulate a user interaction with the notification - namely, the "opening" of it (equivalent to a user's tap/swipe on it in the notification center).

## Mocking App Launch With a Notification

`launchApp()` with custom parameters (i.e. `userNotification`) will trigger the mocking mechanism.

```js
await device.launchApp({newInstance: true, userNotification: notification});
```

#### Example

```js
describe('Launch with push notification', () => {
  it('should handle the notification', async () => {
    await device.launchApp({
      newInstance: true,
      userNotification: userNotificationPushTrigger,
    });
    await expect(element(by.text('From push'))).toBeVisible();
  });
});
```

## Mocking Notification Reception on a Running App

Use the `sendUserNotification()` method to send notification to **running** app. Notifications can be sent to an active or a background app.

> Note: while the name `sendUserNotification()` is not very idiomatic on Android, as notification data is not "sent" to apps (rather, it is bundled into an Activity/Service launch Intent as Intent-extras), this unified API is used, for the time being, for both platforms equivalently. With [plans of a more extensive support](https://github.com/wix/Detox/issues/2141) for Android, we estimate it would be deprecated when the time comes.

```js
await device.sendUserNotification(notification);
```

**Example:**

```js
describe('Foreground user notifications', () => {
  it('should handle the local notification from inside the app', async () => {
    await device.launchApp();
    await device.sendUserNotification(localNotification);
    await expect(element(by.text('from local notification'))).toBeVisible();
   });
});
```

## Notification JSON Format

User notifications are passed as JSON objects to Detox. The JSON object needs to provide some required data, but can also provide an additional, optional payload.

**Mind the major difference here between the two platforms.** While on iOS many types of data fields are applicable, Android is very loosely defined - with support for just free-form user data in the `payload` field.

| Key | Required | Value Type | Platform | Description |
|---------------------|----------|------------|---------------------------------------------------------------------------------------------------|---------------------|
| `trigger` | Yes | Object | iOS | The conditions that trigger the delivery of the notification. See the [Triggers section](https://github.com/wix/detox/wiki/User-Notifications-JSON-Format-Documentation#triggers) below. |
| `title` | No | String | iOS | A short description of the reason for the alert. |
| `subtitle` | No | String | iOS | A secondary description of the reason for the alert. |
| `body` | No | String | iOS | The body of the notification. |
| `badge` | No | Integer | iOS | The number to display as the app’s icon badge. |
| `payload` | iOS: No<br />Android: Yes | Object | iOS & Android | An object of custom information associated with the notification.<br />Android: see [full description below](#Payload) |
| `category` | No | String | iOS | The identifier of the app-defined category object. |
| `content-available` | No | Integer | iOS | Include this key with a value of 1 to configure a silent notification. |
| `user-text` | No | String | iOS | The text response provided by the user. |
| `action-identifier` | No | String | iOS | The identifier for the action that the user selected. |

### Triggers (iOS-only)

Triggers are objects representing the trigger.

| Key | Required | Value Type | Description |
|-------------------|-------------------------------------|------------|-------------------------------------------------------------------------------------------------------------|
| `type` | Yes | String | The conditions that trigger the delivery of the notification. See the Trigger Types section below. |
| `repeats` | No | Boolean | Indicates whether the event repeats. Only used for `calendar`, `timeInterval` and `location` trigger types. |
| `timeInterval` | Yes for `timeInterval` trigger type | Number | The time interval used to create the trigger. |
| `date-components` | Yes for `calendar` trigger type | Object | The date components used to construct this object. See the Date Components section below. |
| `region` | Yes for `location` trigger type | Object | The region used to determine when the notification is sent. See the Region section below. |

#### Trigger Types

There are four types of triggers supported by Detox at this time:
- `push`
- `calendar`
- `timeInterval`
- `location`

For convenience, these trigger types are provided as constants in `DetoxConstants`:

```js
const DetoxConstants = require('detox').DetoxConstants;

const userNotification = {
	"trigger": {
		"type": DetoxConstants.userNotificationTriggers.push
	},
	...
}
```

### Date Components (iOS-only)

| Key | Required | Value Type | Description |
|------------------|----------|------------|-------------------------------------------------------|
| `era` | No | Integer | The number of era units for the receiver. |
| `year` | No | Integer | The number of year units for the receiver. |
| `month` | No | Integer | The number of month units for the receiver. |
| `day` | No | Integer | The number of day units for the receiver. |
| `hour` | No | Integer | The number of hour units for the receiver. |
| `minute` | No | Integer | The number of minute units for the receiver. |
| `second` | No | Integer | The number of second units for the receiver. |
| `weekday` | No | Integer | The number of the weekday unit for the receiver. |
| `weekdayOrdinal` | No | Integer | The ordinal number of weekday units for the receiver. |
| `quarter` | No | Integer | The number of quarters for the receiver. |
| `weekOfMonth` | No | Integer | The week number of the month for the receiver. |
| `leapMonth` | No | Boolean | Indicates whether the month is a leap month. |

### Region (iOS-only)

| Key | Required | Value Type | Description |
|-----------------|----------|------------|------------------------------------------------------------------------------------|
| `center` | Yes | Object | The center point of the geographic area. See the [Coordinate section](https://github.com/wix/detox/wiki/User-Notifications-JSON-Format-Documentation#coordinate) below. |
| `radius` | Yes | Number | The radius (measured in meters) that defines the geographic area’s outer boundary. |
| `notifyOnEntry` | No | Boolean | Indicates that notifications are generated upon entry into the region. |
| `notifyOnExit` | No | Boolean | Indicates that notifications are generated upon exit from the region. |

### Coordinate (iOS-only)

| Key | Required | Value Type | Description |
|-------------|----------|------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `latitude` | Yes | Number | The latitude in degrees. Positive values indicate latitudes north of the equator. Negative values indicate latitudes south of the equator. |
| `longitude` | Yes | Number | The longitude in degrees. Measurements are relative to the zero meridian, with positive values extending east of the meridian and negative values extending west of the meridian. |

### Payload

On Android, the content will be available via the activity's [`getIntent()`](https://developer.android.com/reference/android/app/Activity#getIntent()) API, inside the intent's _extra_ bundle. Under some limitations, that includes data-cascading so as to provide comprehensive support for Javascript's advanced object-hierarchy capabilities as much as possible. As an example, consider this payload:

```javascript
  const userNotification = {
    payload: {
      userData: 'userDataValue',
      userDataNum: 111.2,
      userDataFlag: true,
      userDataArray: ['rock', 'paper', 'scissors'],
      userDataObj: {
        cascadedKey: 'cascadedValue'
      },
    },
  };

```

The outcome on the native side will be such that all of these conditions evaluate to _true_:

```java
activity.getIntent().getStringExtra("userData") == "userDataValue";
activity.getIntent().getDoubleExtra("userDataNum") == 111.2;
activity.getIntent().getBooleanExtra("userDataFlag") == true;
activity.getIntent().getStringArrayExtra("userDataArray")[0] == "rock";
activity.getIntent().getBundleExtra("userDataObj").getString("cascadedKey") == "cascadedValue";
```

#### Handling at Runtime

Note that on Android, data delivered through an intent at runtime, is typically received in your activity's [`onNewIntent`](https://developer.android.com/reference/android/app/Activity#onNewIntent(android.content.Intent)) callback. Be sure to consider what should be done in order to handle this type of a use case in your app: Namely, that `setIntent()` should be called in order for the data to be later available in your app through `getIntent()`, as explained earlier.

>  **This isn't related to Detox in particular**, and is set here simply to help you consider all the use cases in your app so that tests coverage would be optimal.

### Examples

1. [Calendar Trigger](https://github.com/wix/detox/blob/master/detox/ios/DetoxUserNotificationTests/user_notification_calendar_trigger.json)
2. [Location Trigger](https://github.com/wix/detox/blob/master/detox/ios/DetoxUserNotificationTests/user_notification_location_trigger.json)
3. [Time Interval Trigger](https://github.com/wix/detox/blob/master/detox/ios/DetoxUserNotificationTests/user_notification_timeInterval_trigger.json)
4. [Push Trigger](https://github.com/wix/detox/blob/master/detox/ios/DetoxUserNotificationTests/user_notification_push_trigger.json)
