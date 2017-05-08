# Usage: Actions

Detox uses **Matchers** to find elements in your app, **Actions** to emulate user interaction with those elements and **Assertions** to test how your app reacts.

### Actions 
Actions are functions that emulate user behavior:

```js
await element(by.text('Tap Me')).tap();
await element(by.text('Tap Me')).longPress();
await element(by.id('UniqueId819')).multiTap(3);
await element(by.id('UniqueId937')).typeText('passcode');
await element(by.id('UniqueId937')).replaceText('passcode again');
await element(by.id('UniqueId005')).clearText();
await element(by.id('ScrollView161')).scroll(100, 'down');
await element(by.id('ScrollView161')).scroll(100, 'up');
await element(by.id('ScrollView161')).scrollTo('bottom');
await element(by.id('ScrollView161')).scrollTo('top');

// directions: 'up'/'down'/'left'/'right', speed: 'fast'/'slow'
await element(by.id('ScrollView799')).swipe('down', 'fast');
```

### Assertions

Assertions test how your app behaves:

```js
await expect(element(by.id('UniqueId204'))).toBeVisible();
await expect(element(by.id('UniqueId205'))).toBeNotVisible();
await expect(element(by.id('UniqueId205'))).toExist();
await expect(element(by.id('RandomJunk959'))).toNotExist();
await expect(element(by.id('UniqueId204'))).toHaveText('I contain some text');
await expect(element(by.id('UniqueId204'))).toHaveLabel('I contain some text');
await expect(element(by.text('I contain some text'))).toHaveId('UniqueId204');
await expect(element(by.id('UniqueId146'))).toHaveValue('0');
```

### waitFor
Test async code with waitFor:

```js
await waitFor(element(by.id('UniqueId336'))).toExist().withTimeout(2000);
await waitFor(element(by.text('Text5'))).toBeVisible().whileElement(by.id('ScrollView630')).scroll(50, 'down');
```


### Device control

If this is a react native app, reload react native JS bundle

```js
await device.reloadReactNative();
```

Install the app file defined in the current configuration

```js
await device.installApp();
```

Uninstall the app defined in the current configuration
```js
await device.uninstallApp();
```
