# System

System APIs allows you to interact with elements in the system-level, such as dialogs, alerts, OS browser, push notifications, etc.

::: note

**System APIs are only available on iOS**. Android support is coming soon.

:::

## Matchers

System matchers are used to find elements within the system:

- [`by.system.label(label)`]
- [`by.system.type(type)`]

### `by.system.label(label)`

Match elements with the specified label.

```js
system.element(by.system.label('Dismiss'));
```

### `by.system.type(type)`

Match elements with the specified type.

The type value can be any of [`XCUIElement.ElementType`][iOS element-type] values, such as `'button'` or `'textField'`.

```js
system.element(by.system.type('button'));
```

## Actions

System actions are used to interact with elements within the system:

- [`tap()`]

### `tap()`

Tap on the element.

```js
system.element(by.system.label('Allow')).tap();
```

## Expectations

System expectations are used to assert the state of elements within the system:

- [`toExist()`]
- [`not`]

### `toExist()`

Asserts that the element exists.

```js
await system.element(by.system.label('Allow')).toExist();
```

### `not`

Negates the expectation.

```js
await system.element(by.system.label('Allow')).not.toExist();
```

[`by.system.label(label)`]: #bysystemlabellabel
[`by.system.type(type)`]: #bysystemtypetype
[`tap()`]: #tap
[`toExist()`]: #toexist
[`not`]: #not
[iOS element-type]: https://developer.apple.com/documentation/xctest/xcuielement/elementtype
