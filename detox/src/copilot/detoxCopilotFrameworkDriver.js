// eslint-disable-next-line node/no-extraneous-require
const jestExpect = require('expect').default;

const detox = require('../..');

const detoxCopilotFrameworkDriver = {
  apiCatalog: {
    context: { ...detox, jestExpect },
    categories: [
      {
        title: 'Matchers',
        items: [
          {
            signature: 'by.id(id: string)',
            description: 'Matches elements by their test ID.',
            example: "element(by.id('loginButton'))",
            guidelines: ['Use test IDs (accessibility identifiers) to uniquely identify elements. This is the best-practice matcher.'],
          },
          {
            signature: 'by.text(text: string)',
            description: 'Matches elements by their text.',
            example: "element(by.text('Login'))",
            guidelines: ['Prefer test IDs over text matchers when possible.'],
          },
          {
            signature: 'by.type(type: string)',
            description: 'Matches elements by their type.',
            example: "element(by.type('RCTTextInput'))",
            guidelines: ['Use type matchers as a last resort.'],
          },
          {
            signature: 'atIndex(index: number)',
            description: 'Selects the element at the specified index from matched elements.',
            example: "element(by.id('listItem')).atIndex(2)",
            guidelines: ['Use when multiple elements match the same matcher.'],
          },
        ],
      },
      {
        title: 'Actions',
        items: [
          {
            signature: 'tap(point?: Point2D)',
            description: 'Simulates tap on an element.',
            example: "await element(by.id('loginButton')).tap();",
          },
          {
            signature: 'longPress(point?: Point2D, duration?: number)',
            description: 'Simulates long press on an element.',
            example: "await element(by.id('menuItem')).longPress();",
            guidelines: ['Tapping on edges of elements might work better when adding a small offset to the point.'],
          },
          {
            signature: 'multiTap(times: number)',
            description: 'Simulates multiple taps on an element.',
            example: "await element(by.id('tappable')).multiTap(3);",
          },
          {
            signature: 'typeText(text: string)',
            description: 'Types text into a text field.',
            example: "await element(by.id('usernameInput')).typeText('myusername');",
            guidelines: ['Element must be a text input field.'],
          },
          {
            signature: 'replaceText(text: string)',
            description: 'Replaces text in a text field.',
            example: "await element(by.id('textField')).replaceText('new text');",
          },
          {
            signature: 'clearText()',
            description: 'Clears text from a text field.',
            example: "await element(by.id('textField')).clearText();",
          },
          {
            signature: 'tapReturnKey()',
            description: 'Simulates tapping the return key on the keyboard while the element is focused.',
            example: "await element(by.id('textField')).tapReturnKey();",
          },
          {
            signature: 'tapBackspaceKey()',
            description: 'Simulates tapping the backspace key on the keyboard while the element is focused.',
            example: "await element(by.id('textField')).tapBackspaceKey();",
          },
          {
            signature: 'adjustSliderToPosition(normalizedPosition: number)',
            description: 'Adjusts slider to a normalized position between 0 and 1.',
            example: "await element(by.id('slider')).adjustSliderToPosition(0.75);",
          },
          {
            signature: 'scroll(offset: number, direction: string, startPositionX?: number, startPositionY?: number)',
            description: 'Scrolls an element by an offset in a direction.',
            example: "await element(by.id('scrollView')).scroll(100, 'down');",
            guidelines: [
              'Direction can be "up", "down", "left", or "right".',
              'Use `startPositionX` and `startPositionY` to specify the starting point of the scroll gesture.',
              'If multiple scroll actions are needed while waiting for an element, use `whileElement()` in conjunction with `waitFor()`.',
            ],
          },
          {
            signature: 'scrollTo(edge: string, startPositionX?: number, startPositionY?: number)',
            description: 'Scrolls to an edge of the element.',
            example: "await element(by.id('scrollView')).scrollTo('bottom');",
            guidelines: [
              'Edge can be "top", "bottom", "left", or "right".',
              'Use `startPositionX` and `startPositionY` to specify the starting point of the scroll gesture.',
            ],
          },
          {
            signature: 'whileElement(element: Matcher)',
            description: 'Continuously performs an action while waiting for an expectation to be fulfilled.',
            example: `
await waitFor(element(by.text('Load More')))
  .toBeVisible()
  .whileElement(by.id('scrollView'))
  .scroll(50, 'down');`,
            guidelines: [
              'Used in conjunction with `waitFor()` to perform actions like scrolling while waiting for an element to meet the expectation.',
              'The action (e.g., `scroll`) is performed on the element specified in `whileElement()`.',
            ],
          },
          {
            signature: 'scrollToIndex(index: number)',
            description: 'Scrolls to the specified index (Android only).',
            example: "await element(by.id('scrollView')).scrollToIndex(10);",
          },
          {
            signature: 'swipe(direction: string, speed?: string, normalizedOffset?: number)',
            description: 'Simulates a swipe gesture.',
            example: "await element(by.id('scrollView')).swipe('up');",
            guidelines: [
              'Speed can be "fast" or "slow"; default is "fast".',
              'Direction can be "up", "down", "left", or "right".',
              'Up swipe scrolls down, left swipe scrolls right.',
            ],
          },
          {
            signature: 'setColumnToValue(column: number, value: string)',
            description: 'Sets picker column to a value (iOS only).',
            example: "await element(by.id('pickerView')).setColumnToValue(1, '6');",
          },
          {
            signature: 'setDatePickerDate(dateString: string, dateFormat: string)',
            description: 'Sets date picker to a specific date.',
            example: "await element(by.id('datePicker')).setDatePickerDate('2023-05-25', 'yyyy-MM-dd');",
          },
          {
            signature: 'performAccessibilityAction(actionName: string)',
            description: 'Performs an accessibility action.',
            example: "await element(by.id('scrollView')).performAccessibilityAction('activate');",
          },
          {
            signature: 'pinch(scale: number, speed?: string, angle?: number)',
            description: 'Simulates a pinch gesture.',
            example: "await element(by.id('pinchableView')).pinch(1.1);",
            guidelines: ['Scale >1 to zoom in, <1 to zoom out.'],
          },
          {
            signature: 'getAttributes()',
            description: 'Retrieves attributes of the element.',
            example: `
const attributes = await element(by.text('Tap Me')).getAttributes();
jestExpect(attributes.text).toBe('Tap Me');`,
          },
          {
            signature: 'takeScreenshot(name: string)',
            description: 'Captures a screenshot of the element.',
            example: "const imagePath = await element(by.id('menuRoot')).takeScreenshot('menu_screenshot');",
          },
          {
            signature: 'longPressAndDrag(duration, normalizedPositionX, normalizedPositionY, targetElement, normalizedTargetPositionX, normalizedTargetPositionY, speed, holdDuration)',
            description: `Performs a long press and drags to a target element.
  - \`duration\` — the duration to press for, in ms (required)
  - \`normalizedPositionX\` — X coordinate of the starting point, relative to the element width (required, a number between 0.0 and 1.0, NaN — choose an optimal value automatically)
  - \`normalizedPositionY\` — Y coordinate of the starting point, relative to the element height (required, a number between 0.0 and 1.0, NaN — choose an optimal value automatically)
  - \`targetElement\` — the target element to drag to (required)
  - \`normalizedTargetPositionX\` — X coordinate of the ending point, relative to the target element width (optional, a number between 0.0 and 1.0, NaN — choose an optimal value automatically)
  - \`normalizedTargetPositionY\` — Y coordinate of the ending point, relative to the target element height (optional, a number between 0.0 and 1.0, NaN — choose an optimal value automatically)
  - \`speed\` — the speed of the drag (optional, valid input: "fast"/"slow" , default is "fast")
  - \`holdDuration\` — the duration before releasing at the end, in ms (optional, default is 1000)`,
            example: "await element(by.id('cellId_1')).longPressAndDrag(2000, 0.9, NaN, element(by.id('cellId_6')), 0.9, NaN, 'slow', 0);",
          },
        ],
      },
      {
        title: 'Assertions',
        items: [
          {
            signature: 'toBeVisible()',
            description: 'Asserts that the element is visible.',
            example: "await expect(element(by.id('loginButton'))).toBeVisible();",
          },
          {
            signature: 'toExist()',
            description: 'Asserts that the element exists.',
            example: "await expect(element(by.id('username'))).toExist();",
          },
          {
            signature: 'toHaveText(text: string)',
            description: 'Asserts that the element has the specified text.',
            example: "await expect(element(by.id('label'))).toHaveText('Hello, World!');",
          },
          {
            signature: 'toHaveValue(value: string)',
            description: 'Asserts that the element has the specified value.',
            example: "await expect(element(by.id('slider'))).toHaveValue('0.5');",
          },
          {
            signature: 'toBeFocused()',
            description: 'Asserts that the element is focused.',
            example: "await expect(element(by.id('emailInput'))).toBeFocused();",
          },
          {
            signature: 'toHaveLabel(label: string)',
            description: 'Asserts that the element has the specified accessibility label.',
            example: "await expect(element(by.id('submitButton'))).toHaveLabel('Submit');",
          },
          {
            signature: 'toHaveId(id: string)',
            description: 'Asserts that the element has the specified accessibility identifier.',
            example: "await expect(element(by.text('Submit'))).toHaveId('submitButton');",
          },
          {
            signature: 'toHaveSliderPosition(normalizedPosition: number, tolerance?: number)',
            description: 'Asserts that the slider is at a normalized position.',
            example: "await expect(element(by.id('slider'))).toHaveSliderPosition(0.75);",
          },
          {
            signature: 'toHaveToggleValue(value: boolean)',
            description: 'Asserts that a toggle element is on or off.',
            example: "await expect(element(by.id('switch'))).toHaveToggleValue(true);",
          },
          {
            signature: 'withTimeout(timeout: number)',
            description: 'Waits until the expectation is resolved or timeout occurs.',
            example: "await waitFor(element(by.id('bigButton'))).toBeVisible().withTimeout(2000);",
          },
          {
            signature: 'not',
            description: 'Negates the expectation.',
            example: "await expect(element(by.id('tinyButton'))).not.toBeVisible();",
          },
        ],
      },
      {
        title: 'Utilities',
        items: [
          {
            signature: 'jestExpect',
            description: 'Jest expect utility for additional assertions.',
            example: `
jestExpect(2 + 2).toBe(4);
jestExpect('hello').toBe('hello');`,
          },
        ],
      },
      {
        title: 'Device APIs',
        items: [
          {
            signature: 'device.launchApp(params?: object)',
            description: `
Launches the app with specified parameters.

**Parameters:**
- \`newInstance\` (boolean): If \`true\`, terminates the app and launches a new instance.
- \`delete\` (boolean): If \`true\`, deletes the app data before launching.
- \`launchArgs\` (object): Additional launch arguments as key-value pairs.
- \`url\` (string): URL to open in the app.
- \`permissions\` (object): Permissions to grant the app. Supported permissions are:
| Permission      | Values                     |
|-----------------|----------------------------|
| **location**    | always / inuse / never / unset |
| **contacts**    | YES / NO / unset / limited     |
| **photos**      | YES / NO / unset / limited     |
| **calendar**    | YES / NO / unset               |
| **camera**      | YES / NO / unset               |
| **medialibrary**| YES / NO / unset               |
| **microphone**  | YES / NO / unset               |
| **motion**      | YES / NO / unset               |
| **reminders**   | YES / NO / unset               |
| **siri**        | YES / NO / unset               |
| **notifications**| YES / NO / unset              |
| **health**      | YES / NO / unset               |
| **homekit**     | YES / NO / unset               |
| **speech**      | YES / NO / unset               |
| **faceid**      | YES / NO / unset               |
| **userTracking**| YES / NO / unset               |
`,
            example: `
await device.launchApp({ newInstance: true });
await device.launchApp({ newInstance: true, permissions: { notifications: 'YES' } });
await device.launchApp({ launchArgs: { someLaunchArg: 1234 } });`,
            guidelines: ['Use minimal parameters necessary for your launch scenario.'],
          },
          {
            signature: 'device.reloadReactNative()',
            description: 'Reloads the React Native JS bundle.',
            example: 'await device.reloadReactNative();',
          },
          {
            signature: 'device.setOrientation(orientation: string)',
            description: 'Rotates the device to the specified orientation.',
            example: 'await device.setOrientation("landscape");',
            guidelines: ['Orientation can be "portrait" or "landscape".'],
          },
          {
            signature: 'device.setLocation(lat: number, lon: number)',
            description: 'Sets the device location.',
            example: 'await device.setLocation(37.7749, -122.4194);',
          },
          {
            signature: 'device.takeScreenshot(name?: string)',
            description: 'Captures a screenshot of the device.',
            example: 'const path = await device.takeScreenshot("home_screen");',
          },
          {
            signature: 'device.getPlatform()',
            description: 'Returns the current device platform ("ios" or "android").',
            example: 'const platform = device.getPlatform();',
            guidelines: ['Use to conditionally execute platform-specific code.'],
          },
          {
            signature: 'device.openURL(url: string)',
            description: 'Opens a deeplink within the app, or a URL in the browser.',
            example: 'await device.openURL("app://home");',
          }
        ],
      },
      {
        title: 'System APIs (iOS)',
        items: [
          {
            signature: 'system.element(matcher: Matcher)',
            description: 'Selects an element within the system UI.',
            example: "system.element(by.system.label('Allow')).tap();",
            guidelines: [
              'Can be used for iOS system alerts and permissions dialogs',
              'Check the platform with `device.getPlatform()` before using, as it is iOS-specific',
              'System dialogs are not part of the app, so they won\'t be found in the app\'s view hierarchy. Identify the relevant system element from the snapshot.',
            ]
          },
          {
            signature: 'by.system.label(label: string)',
            description: 'Matches system elements by label.',
            example: "system.element(by.system.label('Dismiss'));",
          },
          {
            signature: 'by.system.type(type: string)',
            description: 'Matches system elements by type.',
            example: "system.element(by.system.type('button'));",
          },
          {
            signature: 'tap()',
            description: 'Taps on a system element.',
            example: "system.element(by.system.label('Allow')).tap();",
          },
          {
            signature: 'toExist()',
            description: 'Asserts that the system element exists.',
            example: "await system.element(by.system.label('Allow')).toExist();",
          },
          {
            signature: 'not',
            description: 'Negates the expectation for system elements.',
            example: "await system.element(by.system.label('Allow')).not.toExist();",
          },
        ],
      },
      {
        title: 'Web APIs',
        items: [
          {
            signature: 'web.element(matcher: Matcher)',
            description: 'Selects an element within a web view. Use when there is only one web view on the screen.',
            example: "const element = web.element(by.web.id('username'));",
            guidelines: [
              'Web APIs can only be used with web elements (within web views).',
              'Avoid using web APIs for native elements or native APIs for web elements.',
              'Always prefer the `by.web.id` matcher when possible.',
            ],
          },
          {
            signature: 'web(nativeMatcher).element(matcher: Matcher)',
            description: 'Selects an element within a specific web view matched by a native matcher. Use when there are multiple web views on the screen.',
            example: "const element = web(by.id('webview')).element(by.web.id('password'));",
            guidelines: [
              'Use this method when multiple web views are present.',
              'Prefer `web.element` if only one web view is present on the screen.',
            ],
          },
          {
            signature: 'web(nativeMatcher).atIndex(index: number).element(matcher: Matcher)',
            description: 'Selects an element within a specific web view at a given index (iOS only).',
            example: "const element = web(by.id('webview')).atIndex(1).element(by.web.id('password'));",
            guidelines: [
              'Use when multiple web views with the same identifier are present on iOS.',
              'This matcher is available for iOS only.',
              'Check the platform with `device.getPlatform()` before using.',
            ],
          },
          {
            signature: 'by.web.id(id: string)',
            description: 'Matches web elements by their ID attribute.',
            example: "web.element(by.web.id('submit_button'));",
            guidelines: [
              'Use for web elements with unique IDs.',
              'This is the best-practice matcher for web elements.',
            ],
          },
          {
            signature: 'by.web.className(className: string)',
            description: 'Matches web elements by their CSS class name.',
            example: "web.element(by.web.className('btn-primary'));",
          },
          {
            signature: 'by.web.cssSelector(cssSelector: string)',
            description: 'Matches web elements using a CSS selector.',
            example: "web.element(by.web.cssSelector('.container > .item'));",
          },
          {
            signature: 'by.web.name(name: string)',
            description: 'Matches web elements by their name attribute.',
            example: "web.element(by.web.name('email'));",
          },
          {
            signature: 'by.web.xpath(xpath: string)',
            description: 'Matches web elements using an XPath expression.',
            example: "web.element(by.web.xpath('//*[@id=\"submit\"]'));",
            guidelines: [
              'Use when `by.web.id` is not available.',
              'XPath matchers can be less performant.',
            ],
          },
          {
            signature: 'by.web.href(href: string)',
            description: 'Matches web elements by their href attribute.',
            example: "web.element(by.web.href('https://example.com'));",
          },
          {
            signature: 'by.web.hrefContains(href: string)',
            description: 'Matches web elements whose href attribute contains the specified string.',
            example: "web.element(by.web.hrefContains('example.com'));",
          },
          {
            signature: 'by.web.tag(tag: string)',
            description: 'Matches web elements by their tag name.',
            example: "web.element(by.web.tag('h1'));",
          },
          {
            signature: 'by.web.value(value: string)',
            description: 'Matches web elements by their value attribute (iOS only).',
            example: "web.element(by.web.value('Submit'));",
            guidelines: ['Available on iOS only.'],
          },
          {
            signature: 'by.web.label(label: string)',
            description: 'Matches web elements by their accessibility label (iOS only, supports `asSecured()`).',
            example: "web.element(by.web.label('Submit')).asSecured();",
            guidelines: [
              'Available on iOS only.',
              'Use when the element has a unique label.',
            ],
          },
          {
            signature: 'by.web.type(accessibilityType: string)',
            description: 'Matches web elements by accessibility type (iOS only, with `asSecured()`).',
            example: "web.element(by.web.type('textField')).asSecured();",
            guidelines: [
              'Available on iOS only and used with `asSecured()`.',
              'Type can be any XCUIElement.ElementType, e.g., "button", "textField".',
            ],
          },
          {
            signature: 'atIndex(index: number)',
            description: 'Selects the web element at the specified index from matched elements.',
            example: "web.element(by.web.tag('h1')).atIndex(1);",
            guidelines: ['Use when multiple web elements match the same matcher.'],
          },
          {
            signature: 'tap()',
            description: 'Taps on a web element.',
            example: "await web.element(by.web.id('link')).tap();",
            guidelines: [
              'Supports `asSecured()` on iOS.',
              'Use `asSecured()` when interacting with secured web views.',
            ],
          },
          {
            signature: 'typeText(text: string, isContentEditable?: boolean)',
            description: 'Types text into a web element.',
            example: "await web.element(by.web.name('search')).typeText('Detox');",
            guidelines: [
              'Set `isContentEditable` to `true` for content-editable elements on Android.',
              'On iOS, content-editable elements are automatically detected.',
              'Supports `asSecured()` on iOS.',
            ],
          },
          {
            signature: 'replaceText(text: string)',
            description: 'Replaces text in a web element.',
            example: "await web.element(by.web.name('search')).replaceText('Detox');",
            guidelines: [
              'Currently not supported for content-editable elements on Android.',
              'Supports `asSecured()` on iOS.',
            ],
          },
          {
            signature: 'clearText()',
            description: 'Clears text from a web element.',
            example: "await web.element(by.web.name('search')).clearText();",
            guidelines: [
              'Currently not supported for content-editable elements on Android.',
              'Supports `asSecured()` on iOS.',
            ],
          },
          {
            signature: 'selectAllText()',
            description: 'Selects all text in a web element.',
            example: "await web.element(by.web.id('editor')).selectAllText();",
            guidelines: [
              'Supported for content-editable elements only on Android.',
              'On iOS, Detox can select all text of any element that supports it.',
            ],
          },
          {
            signature: 'getText()',
            description: 'Retrieves the text content of a web element.',
            example: `
const text = await web.element(by.web.id('identifier')).getText();
jestExpect(text).toBe('Hello World!');
`,
            guidelines: [
              'Use for assertions on the element\'s text content.',
              'Requires importing `jestExpect` for assertions.',
            ],
          },
          {
            signature: 'scrollToView()',
            description: 'Scrolls the web view to bring the element into view.',
            example: "await web.element(by.web.id('footer')).scrollToView();",
          },
          {
            signature: 'focus()',
            description: 'Focuses on a web element.',
            example: "await web.element(by.web.id('search')).focus();",
          },
          {
            signature: 'moveCursorToEnd()',
            description: 'Moves the input cursor to the end of the element\'s content.',
            example: "await web.element(by.web.id('editor')).moveCursorToEnd();",
            guidelines: [
              'Supported for content-editable elements only on Android.',
              'On iOS, Detox can move the cursor to the end of any element that supports it.',
            ],
          },
          {
            signature: 'runScript(script: string, args?: any[])',
            description: 'Runs a JavaScript function on the element.',
            example: `
const webElement = web.element(by.web.id('identifier'));
await webElement.runScript('(el) => el.click()');

// With arguments
await webElement.runScript('(el, args) => el.setAttribute("value", args[0])', ['Detox']);

// Using function syntax
const fontSize = await webElement.runScript(function get(element) {
  return element.style.fontSize;
});
jestExpect(fontSize).toBe('16px');

// Scrolling to the bottom of a scrollable web-element
await webElement.runScript('el => el.scrollTop = el.scrollHeight');
`,
            guidelines: [
              'The script can accept additional arguments and return a value.',
              'Ensure that arguments and return values are serializable.',
              'Useful for custom interactions or retrieving properties.',
            ],
          },
          {
            signature: 'getCurrentUrl()',
            description: 'Retrieves the current URL of the web view.',
            example: `
const url = await web.element(by.web.id('identifier')).getCurrentUrl();
jestExpect(url).toBe('https://example.com');
`,
            guidelines: [
              'Must be called from an inner element, not the root web view.',
              'May have issues on Android; check relevant GitHub issues.',
            ],
          },
          {
            signature: 'getTitle()',
            description: 'Retrieves the title of the web view.',
            example: `
const title = await web.element(by.web.id('identifier')).getTitle();
jestExpect(title).toBe('Welcome Page');
`,
            guidelines: [
              'Must be called from an inner element, not the root web view.',
            ],
          },
          {
            signature: 'toHaveText(text: string)',
            description: 'Asserts that the web element has the specified text.',
            example: "await expect(web.element(by.web.tag('h1'))).toHaveText('Welcome');",
          },
          {
            signature: 'toExist()',
            description: 'Asserts that the web element exists.',
            example: "await expect(web.element(by.web.xpath('//*[@id=\"main\"]'))).toExist();",
            guidelines: [
              'Supports `asSecured()` on iOS.',
            ],
          },
          {
            signature: 'not',
            description: 'Negates the expectation for web elements.',
            example: "await expect(web.element(by.web.id('error'))).not.toExist();",
            guidelines: [
              'Supports `asSecured()` on iOS.',
            ],
          },
          {
            signature: 'asSecured()',
            description: 'Interacts with secured web views (iOS only).',
            example: "await web.element(by.web.label('Submit')).asSecured().tap();",
            guidelines: [
              'Use for web pages with secured protocols when regular interactions fail.',
              'Available on iOS only and currently experimental.',
              'Less performant and has fewer APIs.',
            ],
          },
        ],
      },
    ],
  },

  captureSnapshotImage: async function () {
    const fileName = `snapshot_${Date.now()}.png`;
    try {
      return await detox.device.takeScreenshot(fileName);
    } catch (_error) {
      return null;
    }
  },

  captureViewHierarchyString: async function () {
    try {
      return detox.device.generateViewHierarchyXml();
    } catch (_error) {
      return 'Unavailable, app is probably not launched yet';
    }
  },
};

module.exports = detoxCopilotFrameworkDriver;
