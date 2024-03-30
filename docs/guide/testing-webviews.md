# Testing WebViews

In this tutorial, we'll go over how you can test a WebView in React Native applications using Detox. We will cover how to engage with web elements in both single and multi WebView scenarios, apply matchers, and execute actions.

WebViews are crucial parts in a lot of mobile applications, rendering content like web pages or PDF documents within the native environment. However, because the content inside WebViews is web content and not native, it isn't straightforward to interact with using Detox. But fear not, Detox has got you covered with its suite of Web View methods.

:::note

This guide provides an overview of testing web views within React Native apps with Detox. For complete API details, refer to our [WebView API documentation][api].

:::

## Step 0: Setting Up Detox

The first thing you'll need is to have your Detox environment properly set up. If you need a hand with that, you can follow the set-up guide [here][setup].

## Step 1: Locating the WebView

Detox provides two approaches for locating the host web view and its inner elements, depending on the number of WebViews on the screen.

### Single WebView Scenario

The case of a single WebView on the screen is the most common scenario, and it's the simplest to handle.

Detox will automatically locate the web view for you, so you don't need to do anything special to find it.
In this case, you can use the [`web.element()`][webelementmatcher] function with web element matchers to reference elements inside it, see [next step][finding-inner-elements] in this guide for further details.

### Multiple Web Views Scenario

In scenarios where there are multiple WebViews displayed on the screen, you will have to identify a particular WebView first.
Use a [native matcher][native-matcher] to do this, same as you would for native elements.

```javascript
const myWebView = web(by.id('webview_identifier'));
```

After locating the web view, you can then use the `myWebView.element()` method with web view matchers to locate elements within it. See [next step][finding-inner-elements] in this guide for further details.

#### Using `atIndex`

It is also possible to locate the web view by applying at-index to the web view matcher in case there are multiple matching web views for the same matcher.

```javascript
const myWebView = web(by.id('webview_identifier').atIndex(1));
```

:::note

`atIndex()` API for WebView matching is currently supported for iOS only. Check our [API documentation][at-index-api] for updates.

:::

## Step 2: Finding Inner Elements

Element matchers are used to find elements within a web view. The [Detox WebView APIs][matchers-apis] provide various matchers for locating elements within a web view (e.g. `by.web.id(id)`, `by.web.className(className)`, `by.web.tag(tag)`, `atIndex(index)` etc.).

Here are examples of using some of the matchers:

```javascript
// Match by ID attribute
const elementByID = web.element(by.web.id('identifier'));

// Match by CSS class name attribute
const elementByClassName = web.element(by.web.className('className'));

// Match by CSS selector
const elementByCSSSelector = web.element(by.web.cssSelector('#cssSelector'));

// Match with index in case of multiple matching elements
const elementAtIndex = web.element(by.web.id('identifier').atIndex(1));
```

### Bypass CORS Restrictions (iOS Only)

When testing web views, you may encounter Cross-Origin Resource Sharing (CORS) restrictions that prevent you from interacting with elements inside the web view.

At the moment, Detox is able to bypass CORS restrictions and other browser security features only on iOS, allowing you to interact with inner elements in cases of CORS restrictions (in most cases).

To bypass CORS restrictions on iOS, you can pass the [`detoxDisableWebKitSecurity`] launch argument. This argument will disable the WebKit security features, allowing Detox to interact with the WebView in a "Sandbox" environment.

```javascript
await device.launchApp({ launchArgs: { detoxDisableWebKitSecurity: true } });
```

## Step 3: Perform Actions

Actions allow you to interact with elements within a web view. The [Detox WebView APIs][actions-apis] provide various actions that can be invoked on inner elements.

For example, here's a simple example for filling a login form and press on login button:

```javascript

// Fill username and password
await web.element(by.web.id('username')).typeText('John Doe');
await web.element(by.web.id('password')).typeText('123456789');

// Press the login button
await web.element(by.web.id('login')).tap();

```

### Perform Custom Actions (`runScript`)

You can also execute custom JavaScript code on the web view using the `runScript` action (see [API docs][run-script-api]).
This is useful for scenarios where you need to interact with the web view in a way that isn't covered by the built-in actions, for fetching data, or for triggering custom events.

For example, you can use `runScript` to get the font size of a text element:

```javascript
// Define the matcher for the inner text element
const textElement = web(by.id('webview_identifier')).element(by.web.id('text_element'));

// Get the font size of a text element
const fontSize = await textElement.runScript(function get(element) {
  return element.style.fontSize;
});

// Use jestExpect to assert the font size
jestExpect(fontSize).toBe('16px');
```

:::note

Using jest-expectations in Detox tests is possible by importing `expect` API from `jest` package and using it with a separate `jestExpect` variable (as shown in the example below).
This is due to the fact that Detox uses its own `expect` API, which is not compatible with jest-expectations.

```javascript
const jestExpect = require('expect').default;
```

:::

## Step 4: Assert on Expected Behaviour

Expectations are assertions on the state of elements within a WebView.

For instance, to verify an element has specific text:

```javascript
await expect(web.element(by.web.id('identifier'))).toHaveText('Hello World!');
```

Or to assert an element does not exist:

```javascript
await expect(web.element(by.web.id('invalid_identifier'))).not.toExist();
```

## Full Example

Here's a full example of a test that interacts with a WebView:

```javascript
it('should login successfully', async () => {
    // Assert the welcome message is not visible before login
    await expect(web.element(by.web.id('welcome_message'))).not.toExist();

    // Fill username and password
    await web.element(by.web.id('username')).typeText('John Doe');
    await web.element(by.web.id('password')).typeText('123456789');

    // Press the login button
    await web.element(by.web.id('login')).tap();

    // Assert the login was successful
    await expect(web.element(by.web.id('welcome_message'))).toHaveText('Welcome, John Doe!');
});
```

[setup]: ../introduction/environment-setup.md
[api]: ../api/webviews.md
[native-matcher]: ../api/matchers.md
[content-editable]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/contentEditable
[webelementmatcher]: ../api/webviews.md#webelementmatcher
[matchers-apis]: ../api/webviews.md#matchers
[actions-apis]: ../api/webviews.md#actions
[run-script-api]: ../api/webviews.md#runscriptscript-args
[finding-inner-elements]: #step-2-finding-inner-elements
[at-index-api]: ../api/webviews.md#webnativematcheratindexindexelementmatcher
[`detoxDisableWebKitSecurity`]: ../api/device.md#12-detoxdisablewebkitsecuritydisable-webkit-security-ios-only
