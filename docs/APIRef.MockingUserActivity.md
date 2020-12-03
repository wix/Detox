# Mocking User Activity

Detox supports mocking user activity for iOS apps.

The user activity API is used to mock an external user activity state. The app normally uses this state to continue the activity inside the app. This API is also used for associated domains, Spotlight search handling and Siri intents.

## Mocking App Launch with a User Activity

Using `launchApp()` with custom params will trigger the mocking mechanism.

```js
await device.launchApp({userActivity: activity});
```
**Example:**

```js
describe('Background user activity', () => {
	it('Launch with user activity', async () => {
	  await device.launchApp({userActivity: activity})
	  await expect(element(by.text('From user activity'))).toBeVisible();
	});
});
```

## Sending User Activity to a Running App

Use the `sendUserActivity()` method.

```js
await device.sendUserActivity(activity)
```

**Example:**

```js
 
describe('Foreground user activity', () => {

beforeEach(async () => {
  await device.launchApp({newInstance: true});
});

it('User activity from inside the app', async () => {
  await device.sendUserActivity(activity);
  await expect(element(by.text('From user activity'))).toBeVisible();
 });
});
```

## User Activity JSON Format


User activities are passed as JSON objects to Detox, which then parses them and creates native objects representing the passed information.

The JSON object passed to Detox needs to provide some required data, but can also provide additional, optional data.

<!--- Use http://www.tablesgenerator.com/markdown_tables to edit these tables. --->

| Key            | Required | Value Type | Description                                                                                                                         |
|----------------|----------|------------|-------------------------------------------------------------------------------------------------------------------------------------|
| `activityType` | Yes      | String     | The activity type. Either a custom user string or a predefined constant as provided by Detox. See the Activity Types section below. |
| `webpageURL`   | No       | String     | Used when simulating an associated domain link opening. This is the URL that the user browsed to.                                   |
| `referrerURL`  | No       | String     | Used when simulating an associated domain link opening. This is the URL that the user browsed from.                                 |
| `userInfo`     | No       | Object     | An additional key-value pair storage, used for general purpose data passing to the app.                                             |

### Activity Types

Activities can be both developer-generated user activity state, such as actions from another system—another iOS device, macOS, Safari, etc., and system-generated user activities, such as user browed an associated domain, Spotlight search tapped, Siri intent activity, etc.,  where the app should handle such an activity.

Detox supports mocking both types.

For developer-generated user activities, use a custom `activityType` that is expected by the application.

For system-generated user activities, use set the `activityType` to a predefined constant in Detox, like so:

```js
const DetoxConstants = require('detox').DetoxConstants;

const userActivityBrowsingWeb = {
  "activityType": DetoxConstants.userActivityTypes.browsingWeb,
  "webpageURL": "https://my.deeplink.dtx",
  "referrerURL": "https://google.com/"
};
```

Currently supported system-generated activity types:

* DetoxConstants.userActivityTypes.browsingWeb - Used for associated domains (deep links)
* DetoxConstants.userActivityTypes.searchableItem - Used for Spotlight search results 

### Spotlight Search Results

In addition to `DetoxConstants.userActivityTypes.searchableItem`, Detox also provides an additional constant, used to provide the item identifier, which was selected in Spotlight. The app uses this identifier to display the item on screen.

An example on a Spotlight search user activity:

```js
const DetoxConstants = require('detox').DetoxConstants;

let userActivitySearchableItem = {
  "activityType": DetoxConstants.userActivityTypes.searchableItem,
  "userInfo": {"customKey": "value"}
};
userActivitySearchableItem.userInfo[DetoxConstants.searchableItemActivityIdentifier] = "com.test.itemId"
```
