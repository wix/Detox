# Manual Synchronization Using `waitFor`

In most cases, tests should be automatically synchronized with the app. When synchronization doesn't work, you have a fail-safe by using `waitFor`. This API polls using the given expectation continuously until the expectation is met. Use manual synchronization with `waitFor` only as a last resort. Polling for expectations isn't exactly a best practice.

Test async code with waitFor.<br>
**Hang the test until an expectation is met.**

### Methods

- [`.toBeVisible()`](#tobevisible)
- [`.toBeNotVisible()`](#tobenotvisible)
- [`.toExist()`](#toexist)
- [`.toNotExist()`](#tonotexist)
- [`.toHaveText()`](#tohavetexttext)
- [`.toHaveId()`](#tohaveidid)
- [`.withTimeout()`](#withtimeoutmillis)
- [`.whileElement()`](#whileelement)


>NOTE: Every `waitFor` call must set a timeout using `withTimeout()`. Calling `waitFor` without setting a timeout will behave like `expect`.

### `toBeVisible()`
Similar to [`expect.toBeVisible()`](APIRef.Expect.md#tobevisible), but test will hang until expectation is met or a timeout has occurred<br>
Wait for the view to be at least 75% visible.

```js
await waitFor(element(by.id('UniqueId204'))).toBeVisible().withTimeout(2000);
```

### `toBeNotVisible()`
Similar to [`expect.toBeNotVisible()`](APIRef.Expect.md#tobenotvisible), but test will hang until expectation is met or a timeout has occurred<br>
Wait for the view to not be visible.

```js
await waitFor(element(by.id('UniqueId205'))).toBeNotVisible().withTimeout(2000);
```

### `toExist()`
Similar to [`expect.toExist()`](APIRef.Expect.md#toexist), but test will hang until expectation is met or a timeout has occurred<br>
Wait for the view to exist in the UI hierarchy.

```js
await waitFor(element(by.id('UniqueId205'))).toExist().withTimeout(2000);
```

### `toNotExist()`
Similar to [`expect.toNotExist()`](APIRef.Expect.md#tonotexist), but test will hang until expectation is met or a timeout has occurred<br>
Wait for the view to not exist in the UI hierarchy.

```js
await waitFor(element(by.id('RandomJunk959'))).toNotExist().withTimeout(2000);
```

### `toHaveText(text)`
Similar to [`expect.toHaveText()`](APIRef.Expect.md#tohavetexttext), but test will hang until expectation is met or a timeout has occurred<br> 
- In React Native apps, expect UI component of type `<Text>` to have text.

- In native iOS apps, expect UI elements of type UIButton, UILabel, UITextField or UITextViewIn to have inputText with text.

```js
await waitFor(element(by.id('UniqueId204'))).toHaveText('I contain some text').withTimeout(2000);
```

### `toHaveId(id)`
Similar to [`expect.toExist()`](APIRef.Expect.md#toexist), but test will hang until expectation is met or a timeout has occurred<br>

- In React Native apps, expect UI component to have [`testID`](https://facebook.github.io/react-native/docs/view.html#testid) with that id.
- In native iOS apps, expect UI element to have accesibilityIdentifier with that id.

```js
await waitFor(element(by.text('I contain some text'))).toHaveId('UniqueId204').withTimeout(2000);
```


### `withTimeout(millis)`
Waits for the condition to be met until the specified time (millis) have elapsed.

```js
await waitFor(element(by.id('UniqueId336'))).toExist().withTimeout(2000);
```


### `whileElement(element)`
Performs the action repeatedly on the element until an expectation is met.
 
```js
await waitFor(element(by.text('Text5'))).toBeVisible().whileElement(by.id('ScrollView630')).scroll(50, 'down');
```
