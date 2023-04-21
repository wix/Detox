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
await expect(element(by.id('subtitle'))).toBeVisible();
await expect(element(by.id('mainTitle'))).toBeVisible(35);
```

### `toExist()`

Expects the element to exist within the app’s current UI hierarchy.

```js
await expect(element(by.id('okButton'))).toExist();
```

### `toBeFocused()`

Expects the element to be the focused element.

```js
await expect(element(by.id('emailInput'))).toBeFocused();
```

### `toHaveText(text)`

Expects the element to have the specified text.

```js
await expect(element(by.id('mainTitle'))).toHaveText('Welcome back!');
```

### `toHaveLabel(label)`

Expects the element to have the specified label as its accessibility label (iOS) or content description (Android). In React Native, this corresponds to the value in the [`accessibilityLabel`](https://reactnative.dev/docs/accessibility#accessibilitylabel) prop.

:::note
Note that in React Native apps, the `accessibilityLabel` is computed in a non-standard way, which happens to [differ between iOS and Android](https://github.com/facebook/react-native/issues/32826). Detox [bridges over that gap](https://github.com/wix/Detox/issues/3977) by artificially aligning Android to iOS.
Effectively, that means that in React Native apps, performing accessibility-label based matching for elements **with no explicit label** suggests that the matching will be performed against a concatenation of labels from the child-elements, if applicable. For example:

```js
<View testID='title-root'>
  <Text accessibilityLabel={'title'}>Goodbye!</Text>
  <Text accessibilityLabel={'subtitle'}>Thanks for all the fish.</Text>
</View>
```

In this case, where `title-root` has no accessibility label of its own, matching the label of `title-root` will be performed against the text: `title subtitle`.

Also note that in iOS, `accessibilityLabel` for primitive elements such as text, automatically receives the text itself - even if the accessibilityLabel prop isn't explicitly specified.
:::

```js
await expect(element(by.id('submitButton'))).toHaveLabel('Submit');
```

### `toHaveId(id)`

Expects the element to have the specified accessibility identifier. In React Native, this corresponds to the value in the [`testID`](https://reactnative.dev/docs/view.html#testid) prop.

```js
await expect(element(by.text('Submit'))).toHaveId('submitButton');
```

### `toHaveValue(value)`

Expects the element to have the specified accessibility value. In React Native, this corresponds to the value in the [`accessibilityValue`](https://reactnative.dev/docs/view.html#accessibilityvalue) prop.

```js
await expect(element(by.id('temperatureDial'))).toHaveValue('25');
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
await waitFor(element(by.id('bigButton'))).toBeVisible().withTimeout(2000);
```

## Properties

### `not`

Negates the expectation, e.g.:

```js
await expect(element(by.id('tinyButton'))).not.toBeVisible();
await expect(element(by.id('tinyButton'))).not.toExist();
await expect(element(by.id('tinyButton'))).not.toBeFocused();
await expect(element(by.id('tinyButton'))).not.toHaveText('');
await expect(element(by.id('tinyButton'))).not.toHaveValue('');
```
