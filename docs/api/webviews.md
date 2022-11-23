# Web views

A web view is a native component that displays web content within the app. Web views are useful for displaying content that is not available in a native format, such as a web page or a PDF document.

Since the web view elements are not a native part of your app, Detox does not interact with it the same way it does with native elements.
For web views, Detox provides a set of matchers, actions and expectations that allow you to interact with the web view content.

:::info
Testing web views is currently supported for **Android** apps only. We are working on adding support for iOS apps as well.
:::

## Locating the web view

In order to interact with a web view, you need to first find it using a matcher.
The same [matchers] that that can be used in order find native views can be used to locate the web views.

After locating the web view, you can use the [web view matchers] to find elements within the web view, and then use the web view [web view actions] and [web view expectations] to interact with them.

### Example

For example, the following code snippet finds a web view using its accessibility identifier and then finds an inner element, and expects it to have a specific text:

```js
const webview = web(by.id('webview_identifier'));
const innerElement = webview.element(by.web.id('inner_element_identifier'))
await expect(innerElement).toHaveText('Hello World!');
```

## Web view matchers

Web view matchers are used to find elements within a web view.

### Methods

- [`by.id()`]
- [`by.className()`]
- [`by.cssSelector()`]
- [`by.name()`]
- [`by.xpath()`]
- [`by.href()`]
- [`by.hrefContains()`]
- [`by.tag()`]
- [`atIndex()`]

### `by.id(id)`

Match elements with the specified accessibility identifier.

```js
webview.element(by.web.id('identifier'));
```

### `by.className(className)`

Match elements with the specified CSS class name.

```js
webview.element(by.web.className('className'));
```

### `by.cssSelector(cssSelector)`

Match elements with the specified CSS selector.

```js
webview.element(by.web.cssSelector('#cssSelector'));
```

### `by.name(name)`

Match elements with the specified name.

```js
webview.element(by.web.name('name'));
```

### `by.xpath(xpath)`
Match elements with the specified XPath.

```js
webview.element(by.web.xpath('//*[@id="testingh1-1"]'));
```

### `by.href(href)`

Match elements with the specified href.

```js
webview.element(by.web.href('https://wix.com'));
```

### `by.hrefContains(href)`

Match elements that contain the specified href.

```js
webview.element(by.web.hrefContains('wix'));
```

### `by.tag(tag)`

Match elements with the specified tag.

```js
webview.element(by.web.tag('h1'));
```

### `atIndex(index)`

Choose the element at the specified index. This is useful when there are multiple elements that match the same matcher.

```js
webview.element(by.web.tag('h1').atIndex(1));
```

## Web view actions

Web view actions are used to interact with elements within a web view.

### Methods

- [`tap()`]
- [`typeText()`]
- [`replaceText()`]
- [`clearText()`]
- [`selectAllText()`]
- [`getText()`]
- [`scrollToView()`]
- [`focus()`]
- [`moveCursorToEnd()`]
- [`runScript()`]
- [`runScriptWithArgs()`]
- [`getCurrentUrl()`]
- [`getTitle()`]

### `tap()`

Tap the element.

```js
await webview.element(by.web.id('identifier')).tap();
```

### `typeText(text, isContentEditable)`

Type the specified text into the element.

`isContentEditable` is an optional parameter that indicates whether the element should be a [content-editable] (`contenteditable`) element, and defaults to `false`.

```js
await webview.element(by.web.id('identifier')).typeText('Hello World!');
```

### `replaceText(text)`

Replace the text of the element with the specified text.

:::note
This action is currently not supported for content-editable elements.
:::

```js
await webview.element(by.web.id('identifier')).replaceText('Hello World!');
```

### `clearText()`

Clear the text of the element.

:::note
This action is currently not supported for content-editable elements.
:::

```js
await webview.element(by.web.id('identifier')).clearText();
```

### `selectAllText()`

Select all the text of the element.

:::note
This action is currently supported for content-editable elements only.
:::

```js
await webview.element(by.web.id('identifier')).selectAllText();
```

### `getText()`

Get the text of the element.

```js
const text = await webview.element(by.web.id('identifier')).getText();
```

### `scrollToView()`

Scroll to the element, the element top position will be at the top of the screen.

```js
await webview.element(by.web.id('identifier')).scrollToView();
```

### `focus()`

Focus on the element.

```js
await webview.element(by.web.id('identifier')).focus();
```

### `moveCursorToEnd()`

Move the input cursor to the end of the element's content.

:::note
This action is currently supported for content-editable elements only.
:::

```js
await webview.element(by.web.id('identifier')).moveCursorToEnd();
```

### `runScript(script)`

Run the specified script on the element.

The script should be a string that contains a valid JavaScript code that will be executed on the element,
by accepting the element as the first argument.

```js
await webview.element(by.web.id('identifier')).runScript('function foo(element) { console.log(element); }');
```

### `runScriptWithArgs(script, args)`

Run the specified script on the element, with the specified arguments.

The script should be a string that contains a valid JavaScript code that will be executed on the element,
by accepting the specified arguments as the first arguments and the element as the last argument.

```js
await webview.element(by.web.id('identifier')).runScriptWithArgs('function foo(arg1, arg2, element) { console.log(arg1, arg2, element); }', 'arg1', 'arg2');
```

### `getCurrentUrl()`

Get the current URL of the web view.

```js
const url = await webview.getCurrentUrl();
```

### `getTitle()`

Get the title of the web view.

```js
const title = await webview.getTitle();
```

## Web view expectations

Web view expectations are used to assert the state of elements within a web view.

### Methods

- [`toHaveText()`]
- [`toExist()`]
- [`not`]

### `toHaveText(text)`

Assert that the element has the specified text.

```js
await expect(webview.element(by.web.id('identifier'))).toHaveText('Hello World!');
```

### `toExist()`

Assert that the element exists.

```js
await expect(webview.element(by.web.id('identifier'))).toExist();
```

### `not`

Negate the expectation.

```js
await expect(webview.element(by.web.id('identifier'))).not.toHaveText('Hello World!');
```


[matchers]: matchers.md

[web view matchers]: webviews.md#web-view-matchers
[web view actions]: webviews.md#web-view-actions
[web view expectations]: webviews.md#web-view-expectations

[`by.id()`]: webviews.md#byidid
[`by.className()`]: webviews.md#byclassnameclassname
[`by.cssSelector()`]: webviews.md#bycssselectorcssselector
[`by.name()`]: webviews.md#byname
[`by.xpath()`]: webviews.md#byxpathxpath
[`by.href()`]: webviews.md#byhrefhref
[`by.hrefContains()`]: webviews.md#byhrefcontainshref
[`by.tag()`]: webviews.md#bytagtag
[`atIndex()`]: webviews.md#atindexindex

[`tap()`]: webviews.md#tap
[`typeText()`]: webviews.md#typetexttext-iscontenteditable
[content-editable]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/contentEditable
[`replaceText()`]: webviews.md#replacetexttext
[`clearText()`]: webviews.md#cleartext
[`selectAllText()`]: webviews.md#selectalltext
[`getText()`]: webviews.md#gettext
[`scrollToView()`]: webviews.md#scrolltoview
[`focus()`]: webviews.md#focus
[`moveCursorToEnd()`]: webviews.md#movecursortoend
[`runScript()`]: webviews.md#runscriptscript
[`runScriptWithArgs()`]: webviews.md#runscriptwithargsscript-args
[`getCurrentUrl()`]: webviews.md#getcurrenturl
[`getTitle()`]: webviews.md#gettitle

[`toHaveText()`]: webviews.md#tohavetexttext
[`toExist()`]: webviews.md#toexist
[`not`]: webviews.md#not
