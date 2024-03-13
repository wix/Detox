# Web Views

Web views are native components that render content not natively supported by the platform, like web pages or PDF documents.
However, elements within web views are not native components, making direct interaction through Detox challenging.
To address this, Detox offers a suite of matchers, actions, and expectations designed for interacting with content inside web views.

## Locating Elements in Web Views

### `web.element(matcher)`

In cases where there's only one web view present on the screen, you may use the `web.element()` function, paired with [web view matchers], to reference elements within the web view.
Upon obtaining the element reference, you can utilize web view actions and expectations on the webView element.

```js
const innerElement = web.element(by.web.id('inner_element_identifier'));
await expect(innerElement).toHaveText('Hello World!');
```

In the example above, we locate an inner element by its `id` HTML attribute and verify its text content.

### `web(nativeMatcher).element(matcher)`

If you have multiple web views on the screen, you must locate a specific web view first by using a [native matcher][native matchers], e.g.:

```js
const myWebView = web(by.id('webview_identifier'));
```

Following that, you can locate the element within the identified web view:

```js
const innerElement = myWebView.element(by.web.id('inner_element_identifier'));
await expect(innerElement).toHaveText('Hello World!');
```

### `web(nativeMatcher).atIndex(index).element(matcher)` (iOS only)

:::note

This matcher is available for iOS only. See [this GitHub issue](https://github.com/wix/Detox/issues/4398) for more information.

:::

If you have multiple web views on the screen and you want to interact with a specific web view, you can use the `atIndex()` method to choose the web view at the specified index.

```js
const myWebView = web(by.id('webview_identifier')).atIndex(1);
const innerElement = myWebView.element(by.web.id('inner_element_identifier'));
await expect(innerElement).toHaveText('Hello World!');
```

In the example above, we use `atIndex()` to select the second web view on the screen (that has the specified accessibility identifier) and then locate an HTML element inside that web view.

## Matchers

Web view matchers are used to find elements within a web view:

- [`by.web.id()`]
- [`by.web.className()`]
- [`by.web.cssSelector()`]
- [`by.web.name()`]
- [`by.web.xpath()`]
- [`by.web.href()`]
- [`by.web.hrefContains()`]
- [`by.web.tag()`]
- [`atIndex()`]

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

Match form input elements with the specified [`name` attribute][name].

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

:::note

You might face issues with this matcher on Android. Check [this GitHub issue](https://github.com/wix/Detox/issues/4398) for more information.

:::

### `by.web.hrefContains(href)`

Match elements that contain the specified `href`.

```js
web.element(by.web.hrefContains('wix'));
```

:::note

You might face issues with this matcher on Android. Check [this GitHub issue](https://github.com/wix/Detox/issues/4398) for more information.

:::

### `by.web.tag(tag)`

Match elements with the specified tag.

```js
web.element(by.web.tag('h1'));
```

### `atIndex(index)`

Choose the element at the specified index.

```js
web.element(by.web.tag('h1')).atIndex(1);
```

Use it sparingly for those rare cases when you cannot make your matcher less ambiguous, so it returns one element only.

## Actions

Web view actions are used to interact with elements within a web view:

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
- [`getCurrentUrl()`]
- [`getTitle()`]

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

:::note

The `isContentEditable` parameter is currently necessary for content-editable elements only on Android.

On iOS, Detox automatically detects content-editable elements regardless of this parameter.

:::

### `replaceText(text)`

Replace the text of the element with the specified text.

```js
await web.element(by.web.id('identifier')).replaceText('Hello World!');
```

:::note

This action is currently not supported for content-editable elements on Android.

On iOS, Detox automatically detects content-editable elements and replaces their text.

:::

### `clearText()`

Clear the text of the element.

```js
await web.element(by.web.id('identifier')).clearText();
```

:::note

This action is currently not supported for content-editable elements on Android.

On iOS, Detox automatically detects content-editable elements and clears their text.

:::

### `selectAllText()`

Select all the text of the element.

```js
await web.element(by.web.id('identifier')).selectAllText();
```

:::note

This action is currently supported for content-editable elements only on Android.

On iOS, Detox can select all the text of any element that supports it (for example, an input element).

:::

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

```js
await web.element(by.web.id('identifier')).moveCursorToEnd();
```

:::note

This action is currently supported for content-editable elements only on Android.

On iOS, Detox can move the cursor to the end of any element that supports it (for example, an input element).

:::

### `runScript(script[, args])`

Run the specified script on the element.
The script should be a string that contains a valid JavaScript function.
It will be called with that element as the first argument:

```js
const webElement = web.element(by.web.id('identifier'));
await webElement.runScript('(el) => el.click()');
```

For convenience, you can pass a function instead of a string, but please note that this will not work if the function uses any variables from the outer scope:

The script can accept additional arguments and return a value. Make sure the values are primitive types or serializable objects, as they will be converted to JSON and back:

```js
const text = await webElement.runScript(function get(element, property) {
  return element[property];
}, ['textContent']);
```

### `getCurrentUrl()`

Get the current URL of the web view.

```js
const url = await web.element(by.web.id('identifier')).getCurrentUrl();
```

:::note

Although this action returns the URL of the presented web document, it can be called from an inner element only (for example, an iframe id or the HTML) and not from the root native web view element itself.

You might face issues with this action on Android. Check [this GitHub issue](https://github.com/wix/Detox/issues/4398) for more information.

:::

### `getTitle()`

Get the title of the web view.

:::note

Although this action returns the title of the presented web document, it can be called from an inner element only (for example, an iframe id or the HTML) and not from the root native web view element itself.

:::

```js
const title = await web.element(by.web.id('identifier')).getTitle();
```

## Expectations

Web view expectations are used to assert the state of elements within a web view:

- [`toHaveText()`]
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

:::note

You might face issues with this expectation on Android. Check [this GitHub issue](https://github.com/wix/Detox/issues/4398) for more information.

:::

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

[`by.web.id()`]: webviews.md#bywebidid

[`by.web.className()`]: webviews.md#bywebclassnameclassname

[`by.web.cssSelector()`]: webviews.md#bywebcssselectorcssselector

[`by.web.name()`]: webviews.md#bywebnamename

[`by.web.xpath()`]: webviews.md#bywebxpathxpath

[`by.web.href()`]: webviews.md#bywebhrefhref

[`by.web.hrefContains()`]: webviews.md#bywebhrefcontainshref

[`by.web.tag()`]: webviews.md#bywebtagtag

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

[name]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Input#name

[`runScript()`]: webviews.md#runscriptscript-args

[`getCurrentUrl()`]: webviews.md#getcurrenturl

[`getTitle()`]: webviews.md#gettitle

[`toHaveText()`]: webviews.md#tohavetexttext

[`toExist()`]: webviews.md#toexist

[`not`]: webviews.md#not
