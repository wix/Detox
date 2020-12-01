# Mocking Open With URL (Deep Links)

You can mock opening the app from URL to test your app's deep link handling mechanism.

## Mocking App Launch With a URL

```js
await device.launchApp({newInstance: true, url, sourceApp: bundleId}); // sourceApp is an optional iOS-only argument
```

#### Example

```js
describe('launch app from URL', () => {
    it('should handle URL successfully', async () => {
      await device.launchApp({
        newInstance: true,
        url: 'scheme://some.url',
        sourceApp: 'com.apple.mobilesafari'
      });
      await expect(element(by.text('a label'))).toBeVisible();
    });
  });
```

## Mocking Opening With a URL On a Launched App

> iOS-only

```js
await device.openURL({url: 'scheme://some.url', sourceApp: 'com.apple.mobilesafari'});
```

