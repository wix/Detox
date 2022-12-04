# Expect

Detox uses [matchers](matchers.md) to match UI elements in your app and expectations to verify those elements are in the expected state.

Use [actions](actions.md) to simulate use interaction with elements.

## Methods

- [`.toBeVisible()`](#tobevisible)
- [`.toExist()`](#toexist)
- [`.toBeFocused()`](#tobefocused)
- [`.toHaveText()`](#tohavetexttext)
- [`.toHaveLabel()`](#tohavelabellabel)
- [`.toHaveId()`](#tohaveidid)
- [`.toHaveValue()`](#tohavevaluevalue)
- [`.toHaveSliderPosition()`](#tohavesliderpositionnormalizedposition-tolerance)
- [`.toHaveToggleValue()`](#tohavetogglevaluevalue)
- [`.not`](#not)
- [`.withTimeout()`](#withtimeouttimeout)

### `toBeVisible()`

Expects the view to be at least N% visible on the screen.
Accepts an optional parameter of percent threshold of element visibility, integer ranging from 1 to 100, that determines whether the element is visible or not. If no number is provided then defaults to 75%.

Negating this expectation with a `not` expression expects the view’s visible area to be lower than N%.

On iOS, visibility is defined by having the view, or one of its subviews, be topmost at the view’s activation point on screen.

```js
await expect(element(by.id('UniqueId203'))).toBeVisible();
await expect(element(by.id('UniqueId204'))).toBeVisible(35);
```

### `toExist()`

Expects the element to exist within the app’s current UI hierarchy.

```js
await expect(element(by.id('UniqueId205'))).toExist();
```

### `toBeFocused()`

Expects the element to be the focused element.

```js
await expect(element(by.id('textFieldId'))).toBeFocused();
```

### `toHaveText(text)`

Expects the element to have the specified text.

```js
await expect(element(by.id('UniqueId204'))).toHaveText('I contain some text');
```

### `toHaveLabel(label)`

Expects the element to have the specified label as its accessibility label (iOS) or content description (Android). In React Native, this corresponds to the value in the [`accessibilityLabel`](https://reactnative.dev/docs/accessibility#accessibilitylabel) prop.

:::note
Note that there is an inconsistency between the implementation for accessibility between Android and iOS. On iOS if a View has no `accessibilityLabel` explicitly defined, then it defaults to having a concatenation of the accessibilityLabels of the child Views. On Android, the same View would have no `accessibilityLabel` at all. See [this](https://github.com/facebook/react-native/issues/32826) issue for details.
:::

```js
await expect(element(by.id('UniqueId204'))).toHaveLabel('Done');
```

### `toHaveId(id)`

Expects the element to have the specified accessibility identifier. In React Native, this corresponds to the value in the [`testID`](https://reactnative.dev/docs/view.html#testid) prop.

```js
await expect(element(by.text('I contain some text'))).toHaveId('UniqueId204');
```

### `toHaveValue(value)`

Expects the element to have the specified accessibility value. In React Native, this corresponds to the value in the [`accessibilityValue`](https://reactnative.dev/docs/view.html#accessibilityvalue) prop.

```js
await expect(element(by.id('UniqueId533'))).toHaveValue('0');
```

### `toHaveSliderPosition(normalizedPosition, tolerance)`

Expects the slider element to have the specified normalized position (\[0, 1]), within the provided tolerance (optional).

```js
await expect(element(by.id('slider'))).toHaveSliderPosition(0.75);
await expect(element(by.id('slider'))).toHaveSliderPosition(0.3113, 0.00001);
```

### `toHaveToggleValue(value)`

Expects a toggle-able element (e.g. a Switch or a Check-Box) to be on/checked or off/unchecked. As a reference, in react-native, this is the [equivalent switch component](https://reactnative.dev/docs/switch).

```js
await expect(element(by.id('switch'))).toHaveToggleValue(true);
await expect(element(by.id('checkbox'))).toHaveToggleValue(false);
```

### `withTimeout(timeout)`

Waits until the expectation is resolved for the specified amount of time. If timeout is reached before resolution, the expectation is failed.

`timeout`—the timeout to wait, in ms

```js
await waitFor(element(by.id('UniqueId204'))).toBeVisible().withTimeout(2000);
```

## Properties

### `not`

Negates the expectation, e.g.:

```js
await expect(element(by.id('UniqueId533'))).not.toBeVisible();
await expect(element(by.id('UniqueId533'))).not.toExist();
await expect(element(by.id('UniqueId533'))).not.toBeFocused();
await expect(element(by.id('UniqueId533'))).not.toHaveText('');
await expect(element(by.id('UniqueId533'))).not.toHaveValue('');
```
