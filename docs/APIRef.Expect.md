# Expect

Detox uses **Matchers** to find elements in your app, **Actions** to emulate user interaction with those elements and **Expectations** to verify values.

Expect verifies if a certain value is as expected to be.

### Methods

- [`.toBeVisible()`](#tobevisible)
- [`.toBeNotVisible()`](#tobenotvisible)
- [`.toExist()`](#toexist)
- [`.toNotExist()`](#tonotexist)
- [`.toHaveText()`](#tohavetexttext)
- [`.toHaveId()`](#tohaveidid)


### `toBeVisible()`
Expect the view to be at least 75% visible.

```js
await expect(element(by.id('UniqueId204'))).toBeVisible();
```

### `toBeNotVisible()`
Expect the view to not be visible.

```js
await expect(element(by.id('UniqueId205'))).toBeNotVisible();
```

### `toExist()`
Expect the view to exist in the UI hierarchy.

```js
await expect(element(by.id('UniqueId205'))).toExist();
```

### `toNotExist()`
Expect the view to not exist in the UI hierarchy.

```js
await expect(element(by.id('RandomJunk959'))).toNotExist();
```

### `toHaveText(text)`
- In React Native apps, expect UI component of type `<Text>` to have text.

- In native iOS apps, expect UI elements of type UIButton, UILabel, UITextField or UITextViewIn to have inputText with text.

```js
await expect(element(by.id('UniqueId204'))).toHaveText('I contain some text');
```

### `toHaveId(id)`
- In React Native apps, expect UI component to have [`testID`](https://facebook.github.io/react-native/docs/view.html#testid) with that id.
- In native iOS apps, expect UI element to have accesibilityLabel with that id.

```js
await expect(element(by.text('I contain some text'))).toHaveId('UniqueId204');
```