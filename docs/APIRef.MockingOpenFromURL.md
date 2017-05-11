## Mocking Open from URL (Deep Links)

You can mock opening the app from URL to test your app's deep link handling mechanism.

#### Mocking App Launch from a URL

```js
await device.relaunchApp({url: url});
```

**Example:**

```js
describe('relaunchApp', () => {
    before(async () => {
      await device.relaunchApp({url: 'scheme://some.url'});
    });

    it('should tap successfully', async () => {
      await expect(element(by.label('a label'))).toBeVisible();
    });
  });
```

#### Mocking Opening URL on a Launched App
```js
await device.openURL('scheme://some.url');
```