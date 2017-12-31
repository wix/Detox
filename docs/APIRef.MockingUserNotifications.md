---
id: APIRef.MockingUserNotifications
title: Mocking User Notifications
---

Detox supports mocking user notifications for iOS apps.

>NOTE: The mocking mechanism will not mimic the UI of a user notification. Instead, it will only simulate the flow of a user-selected notifications.

### Mocking App Launch with a Notification

Using `relauchApp()` with custom params will trigger the mocking mechanism.

```js
await device.relaunchApp({userNotification: notification});
```
**Example:**

```js
describe('Background push notification', () => {
	beforeEach(async () => {
	  await device.relaunchApp({userNotification: userNotificationPushTrigger})
	});

	it('push notification from background', async () => {
	  await expect(element(by.text('From push'))).toBeVisible();
	});
});
```

### Mocking Notification Reception on a Launched App

Use the `sendUserNotification()` method to send notification to running app.

```js
await device.sendUserNotification(notification)
```

**Example:**
 
```js
 
describe('Foreground user notifications', () => {

beforeEach(async () => {
  await device.relaunchApp();
});

it('Local notification from inside the app', async () => {
  await device.sendUserNotification(localNotification);
  await expect(element(by.text('from local notificaton'))).toBeVisible();
 });
});
```

## Notification JSON Format


User notifications are passed as JSON objects to detox, which then parses them and creates native objects representing the passed information.

The JSON object passed to Detox needs to provide some required data, but can also provide additional, optional data.

<!--- Use http://www.tablesgenerator.com/markdown_tables to edit these tables. --->

| Key | Required | Value Type | Description |
|---------------------|----------|------------|---------------------------------------------------------------------------------------------------|
| `trigger` | Yes | Object | The conditions that trigger the delivery of the notification. See the [Triggers section](https://github.com/wix/detox/wiki/User-Notifications-JSON-Format-Documentation#triggers) below. |
| `title` | No | String | A short description of the reason for the alert. |
| `subtitle` | No | String | A secondary description of the reason for the alert. |
| `body` | No | String | The body of the notification. |
| `badge` | No | Integer | The number to display as the app’s icon badge. |
| `payload` | No | Object | An object of custom information associated with the notification. |
| `category` | No | String | The identifier of the app-defined category object. |
| `content-available` | No | Integer | Include this key with a value of 1 to configure a silent notification. |
| `user-text` | No | String | The text response provided by the user. |
| `action-identifier` | No | String | The identifier for the action that the user selected. |

### Triggers

Triggers are objects representing the trigger.

| Key | Required | Value Type | Description |
|-------------------|-------------------------------------|------------|-------------------------------------------------------------------------------------------------------------|
| `type` | Yes | String | The conditions that trigger the delivery of the notification.<br /><br /> There are four types of triggers supported by Detox at this time:<br /> • `push`<br /> • `calendar`<br /> • `timeInterval`<br /> • `location`<br /> |
| `repeats` | No | Boolean | Indicates whether the event repeats. Only used for `calendar`, `timeInterval` and `location` trigger types. |
| `timeInterval` | Yes for `timeInterval` trigger type | Number | The time interval used to create the trigger. |
| `date-components` | Yes for `calendar` trigger type | Object | The date components used to construct this object. See the [Date Components section](https://github.com/wix/detox/wiki/User-Notifications-JSON-Format-Documentation#date-components) below. |
| `region` | Yes for `location` trigger type | Object | The region used to determine when the notification is sent. See the [Region section](https://github.com/wix/detox/wiki/User-Notifications-JSON-Format-Documentation#region) below. |

### Date Components

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

### Region

| Key | Required | Value Type | Description |
|-----------------|----------|------------|------------------------------------------------------------------------------------|
| `center` | Yes | Object | The center point of the geographic area. See the [Coordinate section](https://github.com/wix/detox/wiki/User-Notifications-JSON-Format-Documentation#coordinate) below. |
| `radius` | Yes | Number | The radius (measured in meters) that defines the geographic area’s outer boundary. |
| `notifyOnEntry` | No | Boolean | Indicates that notifications are generated upon entry into the region. |
| `notifyOnExit` | No | Boolean | Indicates that notifications are generated upon exit from the region. |

### Coordinate

| Key | Required | Value Type | Description |
|-------------|----------|------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `latitude` | Yes | Number | The latitude in degrees. Positive values indicate latitudes north of the equator. Negative values indicate latitudes south of the equator. |
| `longitude` | Yes | Number | The longitude in degrees. Measurements are relative to the zero meridian, with positive values extending east of the meridian and negative values extending west of the meridian. |

### Examples

1. [Calendar Trigger](https://github.com/wix/detox/blob/master/detox/ios/DetoxUserNotificationTests/user_notification_calendar_trigger.json)
2. [Location Trigger](https://github.com/wix/detox/blob/master/detox/ios/DetoxUserNotificationTests/user_notification_location_trigger.json)
3. [Time Interval Trigger](https://github.com/wix/detox/blob/master/detox/ios/DetoxUserNotificationTests/user_notification_timeInterval_trigger.json)
4. [Push Trigger](https://github.com/wix/detox/blob/master/detox/ios/DetoxUserNotificationTests/user_notification_push_trigger.json)
