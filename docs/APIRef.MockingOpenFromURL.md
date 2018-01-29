---
id: APIRef.MockingOpenFromURL
title: Mocking Open from URL (Deep Links)
---

You can mock opening the app from URL to test your app's deep link handling mechanism.

#### Mocking App Launch from a URL

```js
await device.relaunchApp({url: url, sourceApp: bundleId}); //sourceApp is optional
```

**Example:**

```js
describe('relaunchApp', () => {
    before(async () => {
      await device.relaunchApp({url: 'scheme://some.url', sourceApp: 'com.apple.mobilesafari'});
    });

    it('should tap successfully', async () => {
      await expect(element(by.text('a label'))).toBeVisible();
    });
  });
```

#### Mocking Opening URL on a Launched App
```js
await device.openURL({url: 'scheme://some.url', sourceApp: 'com.apple.mobilesafari'});
```

## iOS Requirements

This API requires that the [`application:openURL:options:`](https://developer.apple.com/documentation/uikit/uiapplicationdelegate/1623112-application?language=objc) method is implemented in the application delegate. The legacy deprecated [`application:openURL:sourceApplication:annotation:`](https://developer.apple.com/documentation/uikit/uiapplicationdelegate/1623073-application?language=objc) method is not supported.
