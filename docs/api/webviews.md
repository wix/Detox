# Web Views

Web views are native components that render content not natively supported by the platform, like web pages or PDF documents.
However, elements within web views are not native components, making direct interaction through Detox challenging.
To address this, Detox offers a suite of matchers, actions, and expectations designed for interacting with content inside web views.

## Locating Web View Elements

### Single Web View Scenario

When dealing with a single web view on the screen, use the `web.element()` function with web view matchers to locate elements within it. Once an element is located, you can apply web view actions and expectations to it.

```javascript
const innerElement = web.element(by.web.id('inner_element_identifier'));
await expect(innerElement).toHaveText('Hello World!');
```

This example demonstrates locating an element by its HTML `id` attribute and verifying its text content.

### Multiple Web Views Scenario

For screens with multiple web views, first identify the specific web view using a **[native matcher]**. Then, locate the element within that web view.

```javascript
const myWebView = web(by.id('webview_identifier'));
const innerElement = myWebView.element(by.web.id('inner_element_identifier'));
await expect(innerElement).toHaveText('Hello World!');
```

In this example:
1. The `web()` function and `by.id()` matcher locate the web view by its accessibility identifier.
2. The `myWebView.element()` method and `by.web.id()` matcher locate an HTML element within the web view.
3. The expectation to verify the element's text is the same as in the single web view scenario.

## Matchers

Detox provides various matchers for locating elements within a web view:

- `by.web.id(id)` - Matches elements with the specified HTML `id`.
- `by.web.className(className)` - Matches elements with the specified CSS class name.
- `by.web.cssSelector(cssSelector)` - Matches elements with the specified CSS selector.
- `by.web.name(name)` - Matches form input elements with the specified `name` attribute.
- `by.web.xpath(xpath)` - Matches elements with the specified XPath.
- `by.web.href(href)` - Matches elements with the specified `href` attribute.
- `by.web.hrefContains(hrefContains)` - Matches elements containing a specified `href` substring.
- `by.web.tag(tag)` - Matches elements with the specified tag name.
- `atIndex(index)` - Selects the element at a specified index when multiple matches are found.

### Example Matchers

Here are examples of using some of the matchers:

```javascript
// Match by HTML ID
web.element(by.web.id('identifier'));

// Match by CSS Class Name
web.element(by.web.className('className'));

// Match by CSS Selector
web.element(by.web.cssSelector('#cssSelector'));

// Match with index
web.element(by.web.id('identifier').atIndex(1));
```

## Actions

Actions allow you to interact with elements within a web view. Available actions include:

- `tap()` - Taps the element.
- `typeText(text[, isContentEditable])` - Types text into the element. **Android:** the `isContentEditable` flag indicates if the element is [content-editable], defaulting to `false`.
- `replaceText(text)` - Replaces the element's text. **Android:** not supported for content-editable elements.
- `clearText()` - Clears the element's text. **Android:** not supported for content-editable elements.
- `selectAllText()` - Selects all text of the element. **Android:** supported only for content-editable elements.
- `getText()` - Retrieves the element's text.
- `scrollToView()` - Scrolls until the element is visible at the top of the viewport.
- `focus()` - Focuses on the element.
- `moveCursorToEnd()` - Moves the cursor to the end of the element's content. **Android:** supported only for content-editable elements.
- `runScript(script[, args])` - Executes a JavaScript script on the element. You can pass a function or a string to be executed in the context of the web view, and the result will be returned. **Note:** Can only be called from an inner element.
- `getCurrentUrl()` - Retrieves the current URL of the web view. **Note:** Can only be called from an inner element.
- `getTitle()` - Retrieves the title of the web view. **Note:** Can only be called from an inner element.

### Action Examples

```javascript
// Tap an element
await web.element(by.web.id('identifier')).tap();

// Type text into an element
await web.element(by.web.id('identifier')).typeText('Hello World!');

// Run a JavaScript script on an element
await web.element(by.web.id('identifier')).runScript('(element) => element.click()');

// Run a JavaScript script on an element with paramaters
const text = await webElement.runScript(function get(element, property) {
  return element[property];
}, ['textContent']);
```

## Expectations

Expectations are assertions on the state of elements within a web view:

- `toHaveText(text)` - Asserts the element contains the specified text.
- `toExist()` - Asserts the element exists.
- `not` - Negates the expectation, e.g., `.not.toHaveText('text')`.

### Expectation Examples

```javascript
// Assert an element has specific text
await expect(web.element(by.web.id('identifier'))).toHaveText('Hello World!');

// Assert an element exists
await expect(web.element(by.web.id('identifier'))).toExist();
```

[native matcher]: matchers.md
[content-editable]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/contentEditable
