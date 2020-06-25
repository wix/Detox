# Mocking Open with URL (Deep Links)

You can mock opening the app from URL to test your app's deep link handling mechanism.

## Mocking App Launch with a URL

```js
await device.launchApp({newInstance: true, url: url, sourceApp: bundleId}); //sourceApp is optional
```

#### Example

```js
describe('launch app from URL', () => {
    before(async () => {
      await device.launchApp({
        newInstance: true,
        url: 'scheme://some.url',
        sourceApp: 'com.apple.mobilesafari'
      });
    });

    it('should tap successfully', async () => {
      await expect(element(by.text('a label'))).toBeVisible();
    });
  });
```

## Mocking Opening with a URL on a Launched App

```js
await device.openURL({url: 'scheme://some.url', sourceApp: 'com.apple.mobilesafari'});
```

