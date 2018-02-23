---
id: version-7.X-APIRef.waitFor
title: Manual Synchronization Using `waitFor`
original_id: APIRef.waitFor
---

In most cases, tests should be automatically synchronized with the app. When synchronization doesn't work, you have a fail-safe by using `waitFor`. This API polls using the given expectation continuously until the expectation is met. Use manual synchronization with `waitFor` only as a **last resort**. Polling for expectations isn't exactly a best practice.

Test async code with waitFor.<br>
**Hang the test until an expectation is met.**

### Methods

- [`.toBeVisible()`](#tobevisible)
- [`.toBeNotVisible()`](#tobenotvisible)
- [`.toExist()`](#toexist)
- [`.toNotExist()`](#tonotexist)
- [`.toHaveText()`](#tohavetexttext)
- [`.toHaveValue()`](#tohavevaluevalue)
- [`.withTimeout()`](#withtimeoutmillis)
- [`.whileElement()`](#whileelementelement)

>NOTE: Every `waitFor` call must set a timeout using `withTimeout()`. Calling `waitFor` without setting a timeout **will do nothing**.

>NOTE: `waitFor` will not throw when reaching timeout, instead it will just continue to the next line. To make sure your tests work as you expect them to add `expect()` at the following line.  

### `toBeVisible()`
Test will hang until expectation is met or a timeout has occurred. Should be accompanied with [`expect.toBeVisible()`](APIRef.Expect.md#tobevisible)<br>
Wait for the view to be at least 75% visible.

```js
await waitFor(element(by.id('UniqueId204'))).toBeVisible().withTimeout(2000);
await expect(element(by.id('UniqueId204'))).toBeVisible();
```

### `toBeNotVisible()`
Test will hang until expectation is met or a timeout has occurred. Should be accompanied with [`expect.toBeNotVisible()`](APIRef.Expect.md#tobenotvisible)<br>
Wait for the view to not be visible.

```js
await waitFor(element(by.id('UniqueId205'))).toBeNotVisible().withTimeout(2000);
await expect(element(by.id('UniqueId205'))).toBeNotVisible();
```

### `toExist()`
Test will hang until expectation is met or a timeout has occurred. Should be accompanied with [`expect.toExist()`](APIRef.Expect.md#toexist)<br>
Wait for the view to exist in the UI hierarchy.

```js
await waitFor(element(by.id('UniqueId205'))).toExist().withTimeout(2000);
await expect(element(by.id('UniqueId205'))).toExist();
```

### `toNotExist()`
Test will hang until expectation is met or a timeout has occurred. Should be accompanied with [`expect.toNotExist()`](APIRef.Expect.md#tonotexist)<br>
Wait for the view to not exist in the UI hierarchy.

```js
await waitFor(element(by.id('RandomJunk959'))).toNotExist().withTimeout(2000);
await expect(element(by.id('RandomJunk959'))).toNotExist();
```

### `toHaveText(text)`
Test will hang until expectation is met or a timeout has occurred. Should be accompanied with [`expect.toHaveText(text)`](APIRef.Expect.md#tohavetexttext)<br>
- In React Native apps, expect UI component of type `<Text>` to have text.
- In native iOS apps, expect UI elements of type UIButton, UILabel, UITextField or UITextViewIn to have inputText with text.

```js
await waitFor(element(by.id('UniqueId204'))).toHaveText('I contain some text').withTimeout(2000);
await expect(element(by.id('UniqueId204'))).toHaveText('I contain some text');
```

### `toHaveValue(value)`
Test will hang until expectation is met or a timeout has occurred. Should be accompanied with [`expect.toHaveValue(value)`](APIRef.Expect.md#tohavevaluevalue)<br>

- In React Native apps, expect UI component to have [`testID`](https://facebook.github.io/react-native/docs/view.html#testid) with that id.
- In native iOS apps, expect UI element to have accesibilityIdentifier with that id.

```js
await waitFor(element(by.id('uniqueId'))).toHaveValue('Some value').withTimeout(2000);
await expect(element(by.id('uniqueId'))).toHaveValue('Some value');
```


### `withTimeout(millis)`
Waits for the condition to be met until the specified time (millis) have elapsed.

```js
await waitFor(element(by.id('UniqueId336'))).toExist().withTimeout(2000);
await expect(element(by.id('UniqueId336'))).toExist();
```


### `whileElement(element)`
Performs the action repeatedly on the element until an expectation is met.
 
```js
await waitFor(element(by.text('Text5'))).toBeVisible().whileElement(by.id('ScrollView630')).scroll(50, 'down');
await expect(element(by.text('Text5'))).toBeVisible();
```
