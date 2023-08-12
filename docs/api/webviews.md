# Web views

:::caution Note
There are some gaps between matchers in Android and iOS. Also, evaluation of JS code is not supported on iOS.
:::

A web view is a native component that displays content not available in a native format, such as a web page or a PDF document.

Elements inside web views, however, are not native components, so Detox cannot interact with them the usual way.
That's why Detox provides a set of matchers, actions, and expectations to allow you to interact with the content inside web views.

## Locating web view elements

### `web.element(matcher)`

In the most common case, you will have a single web view on the screen, so you can use `web.element()` function with [web view matchers] to reference elements inside it. After you have a reference to a web element, you can use the [web view actions] and [web view expectations] on it, e.g.:

```js
const innerElement = web.element(by.web.id('inner_element_identifier'));
await expect(innerElement).toHaveText('Hello World!');
```

The code above finds an inner element by HTML `id` attribute, and expects it to have a specific text.

### `web(nativeMatcher).element(matcher)`

If you have multiple web views on the screen, you must locate a specific web view first by using a [native matcher][native matchers], e.g.:

```js
const myWebView = web(by.id('webview_identifier'));
const innerElement = myWebView.element(by.web.id('inner_element_identifier'));
await expect(innerElement).toHaveText('Hello World!');
```

In the example above:

1. We use `web()` function and [`by.id()`] matcher to locate a web view by its accessibility identifier.
1. We use `myWebView.element()` method and [`by.web.id()`] web matcher to find an HTML element inside that web view.
1. We run the same expectation (to have text) as in the previous example.

## Matchers

Web view matchers are used to find elements within a web view:

- [`by.web.id(id)`]
- [`by.web.className(className)`]
- [`by.web.cssSelector(cssSelector)`]
- [`by.web.name(name)`]
- [`by.web.xpath(xpath)`]
- [`by.web.href(href)`]
- [`by.web.hrefContains(hrefContains)`]
- [`by.web.tag(tag)`]
- [`by.web.label(label)`] (**iOS only**)
- [`by.web.value(value)`] (**iOS only**)
- [`atIndex(index)`]

### `by.web.id(id)`

Match elements with the specified accessibility identifier.

```js
web.element(by.web.id('identifier'));
```

### `by.web.className(className)`

Match elements with the specified CSS class name.

```js
web.element(by.web.className('className'));
```

### `by.web.cssSelector(cssSelector)`

Match elements with the specified CSS selector.

```js
web.element(by.web.cssSelector('#cssSelector'));
```

### `by.web.name(name)`

Match elements with the specified name.

```js
web.element(by.web.name('name'));
```

### `by.web.xpath(xpath)`

Match elements with the specified XPath.

```js
web.element(by.web.xpath('//*[@id="testingh1-1"]'));
```

### `by.web.href(href)`

Match elements with the specified `href`.

```js
web.element(by.web.href('https://wix.com'));
```

### `by.web.hrefContains(href)`

Match elements that contain the specified `href`.

```js
web.element(by.web.hrefContains('wix'));
```

### `by.web.tag(tag)`

Match elements with the specified tag.

```js
web.element(by.web.tag('h1'));
```

### `by.web.label(label)`

Match elements with the specified label.

```js
web.element(by.web.label('label'));
```

### `by.web.value(value)`

Match elements with the specified value.

```js
web.element(by.web.value('value'));
```

### `atIndex(index)`

Choose the element at the specified index.

```js
web.element(by.web.tag('h1').atIndex(1));
```

Use it sparingly for those rare cases when you cannot make your matcher less ambiguous, so it returns one element only.

## Actions

Web view actions are used to interact with elements within a web view:

- [`tap()`]
- [`typeText(text)`]
- [`replaceText(text)`]
- [`clearText()`]
- [`selectAllText()`]
- [`getText()`]
- [`scrollToView()`]
- [`focus()`]
- [`moveCursorToEnd()`]
- [`runScript(script)`] (**Android only**)
- [`runScriptWithArgs(script, args)`] (**Android only**)
- [`getCurrentUrl()`] (**Android only**)
- [`getTitle()`] (**Android only**)

### `tap()`

Tap the element.

```js
await web.element(by.web.id('identifier')).tap();
```

### `typeText(text[, isContentEditable])`

Type the specified text into the element.

`isContentEditable` is an optional parameter that indicates whether the element should be a [content-editable] (`contenteditable`) element, and defaults to `false`.

```js
await web.element(by.web.id('identifier')).typeText('Hello World!');
```

### `replaceText(text)`

Replace the text of the element with the specified text.

:::note
This action is currently not supported for content-editable elements.
:::

```js
await web.element(by.web.id('identifier')).replaceText('Hello World!');
```

### `clearText()`

Clear the text of the element.

:::note
This action is currently not supported for content-editable elements.
:::

```js
await web.element(by.web.id('identifier')).clearText();
```

### `selectAllText()`

Select all the text of the element.

:::note
This action is currently supported for content-editable elements only.
:::

```js
await web.element(by.web.id('identifier')).selectAllText();
```

### `getText()`

Get the text of the element.

```js
const text = await web.element(by.web.id('identifier')).getText();
```

### `scrollToView()`

Scroll to the element until its top is at the top of the viewport.

```js
await web.element(by.web.id('identifier')).scrollToView();
```

### `focus()`

Focus on the element.

```js
await web.element(by.web.id('identifier')).focus();
```

### `moveCursorToEnd()`

Move the input cursor to the end of the element's content.

:::note
This action is currently supported for content-editable elements only.
:::

```js
await web.element(by.web.id('identifier')).moveCursorToEnd();
```

### `runScript(script)`

**Android only**

Run the specified script on the element.

The script should be a string that contains a valid JavaScript function.
It will be called with that element as the first argument.

```js
const webElement = web.element(by.web.id('identifier'));
await webElement.runScript(`function foo(element) {
  console.log(element);
}`);
```

### `runScriptWithArgs(script, ...args)`

**Android only**

Run the specified script on the element with extra arguments.

The script should be a string that contains a valid JavaScript function.
It will be called with the specified arguments and the element itself as the last argument.

```js
const webElement = web.element(by.web.id('identifier'));
await webElement.runScriptWithArgs(`function foo(arg1, arg2, element) {
  console.log(arg1, arg2, element);
}`, "foo", 123);
```

### `getCurrentUrl()`

**Android only**

Get the current URL of the web view.

:::note
Although this action returns the URL of the presented web document, it can be called from an inner element only (for example, an iframe id or the HTML) and not from the root native web view element itself.
:::

```js
const url = await web.element(by.web.id('identifier')).getCurrentUrl();
```

### `getTitle()`

**Android only**

Get the title of the web view.

:::note
Although this action returns the title of the presented web document, it can be called from an inner element only (for example, an iframe id or the HTML) and not from the root native web view element itself.
:::

```js
const title = await web.element(by.web.id('identifier')).getTitle();
```

## Expectations

Web view expectations are used to assert the state of elements within a web view:

- [`toHaveText(text)`]
- [`toExist()`]
- [`not`]

### `toHaveText(text)`

Assert that the element has the specified text.

```js
await expect(web.element(by.web.id('identifier'))).toHaveText('Hello World!');
```

### `toExist()`

Assert that the element exists.

```js
await expect(web.element(by.web.id('identifier'))).toExist();
```

### `not`

Negate the expectation.

```js
await expect(web.element(by.web.id('identifier'))).not.toHaveText('Hello World!');
```

[native matchers]: matchers.md

[`by.id()`]: matchers.md#byidid

[web view matchers]: webviews.md#matchers

[web view actions]: webviews.md#actions

[web view expectations]: webviews.md#expectations

[`by.web.id(id)`]: webviews.md#bywebidid

[`by.web.className(className)`]: webviews.md#bywebclassnameclassname

[`by.web.cssSelector(cssSelector)`]: webviews.md#bywebcssselectorcssselector

[`by.web.name(name)`]: webviews.md#bywebnamename

[`by.web.xpath(xpath)`]: webviews.md#bywebxpathxpath

[`by.web.href(href)`]: webviews.md#bywebhrefhref

[`by.web.hrefContains(hrefContains)`]: webviews.md#bywebhrefcontainshref

[`by.web.tag(tag)`]: webviews.md#bywebtagtag

[`by.web.label(label)`]: webviews.md#byweblabellabel

[`by.web.value(value)`]: webviews.md#bywebvaluevalue

[`atIndex(index)`]: webviews.md#atindexindex

[`tap()`]: webviews.md#tap

[`typeText(text)`]: webviews.md#typetexttext-iscontenteditable

[content-editable]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/contentEditable

[`replaceText(text)`]: webviews.md#replacetexttext

[`clearText()`]: webviews.md#cleartext

[`selectAllText()`]: webviews.md#selectalltext

[`getText()`]: webviews.md#gettext

[`scrollToView()`]: webviews.md#scrolltoview

[`focus()`]: webviews.md#focus

[`moveCursorToEnd()`]: webviews.md#movecursortoend

[`runScript(script)`]: webviews.md#runscriptscript

[`runScriptWithArgs(script, args)`]: webviews.md#runscriptwithargsscript-args

[`getCurrentUrl()`]: webviews.md#getcurrenturl

[`getTitle()`]: webviews.md#gettitle

[`toHaveText(text)`]: webviews.md#tohavetexttext

[`toExist()`]: webviews.md#toexist

[`not`]: webviews.md#not
