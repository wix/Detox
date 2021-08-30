# Matchers

Detox uses [matchers](APIRef.Matchers.md) to match UI elements in your app.

Use [actions](APIRef.ActionsOnElement.md) to simulate use interaction with elements and [expectations](APIRef.Expect.md) to verify element states.

**Note:** For best results, it is recommended to match elements by unique identifiers. Matching by text or labels can introduce test flakiness when your app's text change or when changing your app's localization.

## Methods

- [`by.id()`](#byidid)
- [`by.label()`](#bylabellabel)
- [`by.text()`](#bytexttext-discouraged-on-ios)
- [`by.type()`](#bytypeclassname)
- [`by.traits()`](#bytraitstraits-ios-only) **iOS Only**
- [`withAncestor()`](#withancestormatcher)
- [`withDescendant()`](#withdescendantmatcher)
- [`and()`](#andmatcher)
- [`atIndex()`](#atindexindex)

#### `by.id(id)`

Match elements with the specified accessibility identifier. In React Native, this corresponds to the value in the [`testID`](https://reactnative.dev/docs/view.html#testid) prop.

```js
element(by.id('tap_me'));
```

#### `by.label(label)`

Match elements with the specified accessibility label (iOS) or content description (Android). In React Native, this corresponds to the value in the [`accessibilityLabel`](https://reactnative.dev/docs/accessibility#accessibilitylabel) prop.

```js
element(by.label('Welcome'));
```

#### `by.text(text)`

Match elements with the specified text.

```js
element(by.text('Tap Me'));
```

#### `by.type(className)`

Matches elements whose class is, or inherits from, the specified class name. On Android, provide the class canonical name.

**Note:** iOS and Android class names differ.

```js
element(by.type('RCTImageView')); //iOS class name
element(by.type('android.widget.ImageView')); //Android class canonical name
```

#### `by.traits([traits])` **iOS Only**

Matches elements by their [accessibility traits](https://developer.apple.com/documentation/uikit/accessibility/uiaccessibility/accessibility_traits).

Currently supported values:

`"none"`
`"button"`
`"link"`
`"header"`
`"searchField"`
`"image"`
`"selected"`
`"playsSound"`
`"keyboardKey"`
`"staticText"`
`"summaryElement"`
`"notEnabled"`
`"updatesFrequently"`
`"startsMediaSession"`
`"adjustable"`
`"allowsDirectInteraction"`
`"causesPageTurn"`
`"tabBar"`

```js
element(by.traits(['button']));
```

#### `withAncestor(matcher)`

Matches elements with an ancestor that matches the specified matcher.

```js
element(by.id('child').withAncestor(by.id('parent')));
```
#### `withDescendant(matcher)`

Matches elements with at least one descendant that matches the specified matcher.

```js
element(by.id('parent').withDescendant(by.id('child')));
```

#### `and(matcher)`

Matches elements by combining several matchers together.

```js
element(by.id('uniqueId').and(by.text('some text')));
```

#### `atIndex(index)`

If a matcher resolves into multiple matched UI elements, you may specify which element to use by its index.

On iOS, matched elements are sorted by their x and y axes.

**Note:** Due to different underlying implementations of Detox on iOS and Android, as well as other differences in the OS implementations, as well as RN implementation differences on each OS, indices may not match between iOS and Android. Relying on indices may also introduce flakiness in your tests as your app's user interface is updated. It is recommended to use unique identifier matchers for your elements.

```js
element(by.text('Product')).atIndex(2);
```
