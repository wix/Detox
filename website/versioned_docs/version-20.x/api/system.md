# System

System APIs allows you to interact with dialogs in the system-level (e.g. permissions, alerts, etc.).

:::caution Experimental

System APIs are currently in an experimental phase.
This means that the API is not yet final and **may change over minor releases.**

:::

:::note

**System APIs are only available on iOS**. Android support is coming soon.

At the moment, System APIs are limited to system dialogs (e.g. permissions, alerts, etc.).
We plan to expand the System APIs to include more system-level interactions in the future,
such as OS browser (Safari / Chrome), interactions with push notifications, photo library, etc.

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
