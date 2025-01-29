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
            description: 'Matches elements by their text (value).',
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
          {
            signature: 'by.label(label: string)',
            description: 'Match elements with the specified label.',
            example: "element(by.label('Tuesday, 1 October'));",
            guidelines: ['Use when there are no other identifiers, such as for date pickers to select specific days.'],
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
              '`startPositionX` and `startPositionY` are relative to the element\'s width and height, respectively. with values between 0 and 1.',
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
              '`startPositionX` and `startPositionY` are relative to the element\'s width and height, respectively. with values between 0 and 1.',
            ],
          },
          {
            signature: 'waitFor(element: Matcher).toBeVisible(percent?: number).whileElement(element: Matcher).scroll(offset: number, direction: string)',
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
            signature: 'toBeVisible(percent?: number)',
            description: 'Asserts that the element is visible with at-least the specified percentage. Default percent is 75%.',
            example: "await expect(element(by.id('loginButton'))).toBeVisible(38);",
            guidelines: [
              'Use the default visibility percent unless a different percentage is required.',
              'If a percentage value is provided, use the exact percentage required for the test.',
            ],
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
              'Always use `system.element()` to interact with system dialog elements (alerts, permission requests).',
              'Check the platform with `device.getPlatform()` before using, as it is iOS-specific',
              'Permission alerts are part of the system UI, not the app UI. Therefore should be matched with `system.element()`.',
              'System dialogs are not part of the app, so they won\'t be found in the app\'s view hierarchy. Identify the relevant system element from the snapshot.',
            ]
          },
          {
            signature: 'by.system.label(label: string)',
            description: 'Matches system elements by their label (text).',
            example: "system.element(by.system.label('Dismiss'));",
            guidelines: [
              'System elements will not be found in the app\'s view hierarchy. Read the text from the snapshot.',
              'If no system dialog can be found, throw an error with the relevant message.',
            ],
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
            example: "await expect(system.element(by.system.label('Allow'))).toExist();",
          },
          {
            signature: 'not',
            description: 'Negates the expectation for system elements.',
            example: "await expect(system.element(by.system.label('Allow'))).not.toExist();",
          },
        ],
      },
      {
        title: 'Web APIs',
        items: [
          {
            signature: 'web.element(matcher: Matcher)',
            description: 'Selects an element within a web view (`WKWebView` or `RNCWebView`). Use when there is only one web view on the screen.',
            example: `
await web.element(by.web.id('email')).typeText('test@example.com');
await web.element(by.web.id('password')).typeText('password123');
await web.element(by.web.id('login-button')).tap();
            `,
            guidelines: [
              'The web view may take time to load; add a delay using `await new Promise(resolve => setTimeout(resolve, milliseconds));` before the first interaction. This wait should happen only once.',
              'After the initial wait, you can interact with web elements without additional delays.',
              'Use `by.web.id` matcher when possible for matching web elements, as it is the most reliable.',
              'Web APIs can only be used with web elements (within web views). Do not use web APIs for native elements or native APIs for web elements!',
              'Confirm that you are targeting a web view before using this method.'
            ],
          },
          {
            signature: 'web(nativeMatcher: NativeMatcher).element(matcher: Matcher)',
            description: 'Selects an element within a specific web view (`WKWebView` or `RNCWebView`) matched by a native matcher. Use when there are multiple web views on the screen.',
            example: `
// Wait for the specific web view to appear and load (only once before interacting)
await expect(element(by.id('checkout-webview'))).toBeVisible();

// Interact with elements within a specific web view
const specificWebView = web(by.id('checkout-webview'));

await specificWebView.element(by.web.id('credit-card-number')).typeText('4111111111111111');
await specificWebView.element(by.web.id('expiration-date')).typeText('12/25');
await specificWebView.element(by.web.id('cvv')).typeText('123');
await specificWebView.element(by.web.id('pay-button')).tap();
            `,
            guidelines: [
              'Use this method when multiple web views are present.',
              'Ensure the web view is visible and its content is loaded before interacting. This wait should happen only once.',
              'After the initial wait, you can interact with elements within the web view without additional delays.',
              'Webview must be matched with `web(nativeMatcher)` (e.g., `web(by.id(..))` instead of `element(by.id(..))`).',
              'Prefer the basic `web.element()` if only one web view is present on the screen.',
              'Confirm that you are targeting a web view before using this method.'
            ],
          },
          {
            signature: 'web(nativeMatcher: NativeMatcher).atIndex(index: number).element(matcher: Matcher)',
            description: 'Selects an element within a specific web view at a given index (iOS only).',
            example: `
// Interact with an element within the second web view (index starts from 0)
const secondWebView = web(by.id('webview')).atIndex(1);
await secondWebView.element(by.web.id('search-input')).typeText('Detox Testing');
await secondWebView.element(by.web.id('search-button')).tap();
            `,
            guidelines: [
              'Use when multiple web views with the same identifier are present on iOS.',
              'This method is available for iOS only.',
              'Check the platform with `device.getPlatform()` before using.',
            ],
          },
          {
            signature: 'by.web.id(id: string)',
            description: 'Matches web elements by their "id" attribute.',
            example: `await web.element(by.web.id('search')).tap();`,
            guidelines: [
              'Prefer `by.web.id` over any other matchers when available.',
            ],
          },
          {
            signature: 'by.web.className(className: string)',
            description: 'Matches web elements by their CSS class name.',
            example: `await web.element(by.web.className('btn-login')).tap();`,
          },
          {
            signature: 'by.web.cssSelector(cssSelector: string)',
            description: 'Matches web elements using a CSS selector.',
            example: `await web.element(by.web.cssSelector('#product-list .product-item[data-id="123"]')).scrollToView();`,
          },
          {
            signature: 'by.web.name(name: string)',
            description: 'Matches web elements by their name attribute.',
            example: `await web.element(by.web.name('firstName')).typeText('John');`,
          },
          {
            signature: 'by.web.xpath(xpath: string)',
            description: 'Matches web elements using an XPath expression.',
            example: `await web.element(by.web.xpath('//button[text()="Continue"]')).tap();`,
          },
          {
            signature: 'by.web.href(href: string)',
            description: 'Matches web elements by their href attribute.',
            example: `await web.element(by.web.href('https://www.example.com/contact')).tap();`,
          },
          {
            signature: 'by.web.hrefContains(href: string)',
            description: 'Matches web elements whose href attribute contains the specified string.',
            example: `await web.element(by.web.hrefContains('/about')).tap();`,
          },
          {
            signature: 'by.web.tag(tag: string)',
            description: 'Matches web elements by their tag name.',
            example: `await expect(web.element(by.web.tag('h1'))).toHaveText('Welcome to Our Site');`,
          },
          {
            signature: 'by.web.value(value: string)',
            description: 'Matches web elements by their value attribute (iOS only).',
            example: `await web.element(by.web.value('Sign In')).tap();`,
            guidelines: [
              'Available on iOS only.',
            ],
          },
          {
            signature: 'by.web.label(label: string)',
            description: 'Matches web elements by their label (iOS only, supports `asSecured()`).',
            example: `await web.element(by.web.label('Next')).tap();`,
            guidelines: [
              'Available on iOS only.',
              'Use when the inner web element has a unique label or aria-label.',
              'Can be used to match buttons and input elements inside a web view, by their inner text content.',
            ],
          },
          {
            signature: 'by.web.type(accessibilityType: string)',
            description: 'Matches web elements by accessibility type (iOS only, `asSecured()` only).',
            example: `await web.element(by.web.type('textField')).asSecured().typeText('Sample Text');`,
            guidelines: [
              'Available on iOS only and used with `asSecured()`.',
              'Type can be any XCUIElement.ElementType, e.g., "button", "textField".',
            ],
          },
          {
            signature: 'atIndex(index: number)',
            description: 'Selects the web element at the specified index from matched elements.',
            example: `await expect(web.element(by.web.tag('h2')).atIndex(1)).toHaveText('Features');`,
            guidelines: [
              'Use when multiple web elements match the same matcher.',
            ],
          },
          {
            signature: 'tap()',
            description: 'Taps on a web element.',
            example: `await web.element(by.web.label('Submit')).tap();`,
            guidelines: [
              'Supports `asSecured()` on iOS.',
            ],
          },
          {
            signature: 'typeText(text: string)',
            description: 'Types text into a web element.',
            example: `await web.element(by.web.id('rich-text-editor')).typeText('This is a test message');`,
            guidelines: [
              'Supports `asSecured()` on iOS.',
            ],
          },
          {
            signature: 'replaceText(text: string)',
            description: 'Replaces text in a web element.',
            example: `await web.element(by.web.id('username')).replaceText('new_user');`,
            guidelines: [
              'Supports `asSecured()` on iOS.',
            ],
          },
          {
            signature: 'clearText()',
            description: 'Clears text from a web element.',
            example: `await web.element(by.web.id('comments')).clearText();`,
            guidelines: [
              'Supports `asSecured()` on iOS.',
            ],
          },
          {
            signature: 'selectAllText()',
            description: 'Selects all text in a web element.',
            example: `await web.element(by.web.id('notes')).selectAllText();`,
          },
          {
            signature: 'getText()',
            description: 'Retrieves the text content of a web element.',
            example: `
const description = await web.element(by.web.id('product-description')).getText();
jestExpect(description).toContain('This product is made from the finest materials.');
            `,
            guidelines: [
              'Use for assertions on the element\'s text content.',
            ],
          },
          {
            signature: 'scrollToView()',
            description: 'Scrolls the web view to bring the element into view.',
            example: `await web.element(by.web.id('contact-section')).scrollToView();`,
          },
          {
            signature: 'focus()',
            description: 'Focuses on a web element.',
            example: `
await web.element(by.web.id('email-input')).focus();
await web.element(by.web.id('email-input')).typeText('user@example.com');
            `,
            guidelines: [
              'Useful for input fields in a web view that require focus before typing.',
              'No need for secured interactions on iOS.',
            ]
          },
          {
            signature: 'moveCursorToEnd()',
            description: 'Moves the input cursor in a web view to the end of the element\'s content.',
            example: `
await web.element(by.web.id('message-box')).moveCursorToEnd();
await web.element(by.web.id('message-box')).typeText(' Adding more text.');
            `,
          },
          {
            signature: 'runScript(script: string, args?: any[])',
            description: 'Runs a JavaScript function on the web view element.',
            example: `
// Click an element using a custom script
await web.element(by.web.id('hidden-button')).runScript('el => el.click()');

// Set the value of an input field using a custom script
await web.element(by.web.id('username')).runScript('(el, args) => el.value = args[0]', ['new_user']);

// Get the color of an element
const color = await web.element(by.web.id('header')).runScript(function(el) {
  return window.getComputedStyle(el).color;
});
jestExpect(color).toBe('rgb(0, 0, 0)');

// Scroll an element into view if not visible
await web.element(by.web.id('lazy-image')).runScript('el => el.scrollIntoView()');
            `,
            guidelines: [
              'The script can accept additional arguments and return a value.',
              'Ensure that arguments and return values are serializable.',
              'Useful for custom interactions or retrieving properties.',
              'Avoid using this method for simple interactions like tapping or typing.',
            ],
          },
          {
            signature: 'getCurrentUrl()',
            description: 'Retrieves the current URL of the web view.',
            example: `
await web.element(by.web.id('link-to-page')).tap();
const currentUrl = await web.element(by.web.tag('body')).getCurrentUrl();
jestExpect(currentUrl).toBe('https://www.example.com/target-page');
            `,
            guidelines: [
              'Must be called from an inner element, not the root web view.',
            ],
          },
          {
            signature: 'getTitle()',
            description: 'Retrieves the title of the web view.',
            example: `
const pageTitle = await web.element(by.web.tag('body')).getTitle();
jestExpect(pageTitle).toBe('Dashboard - MyApp');
            `,
            guidelines: [
              'Must be called from an inner element, not the root web view.',
            ],
          },
          {
            signature: 'toHaveText(text: string)',
            description: 'Asserts that the web element has the specified text. Used with `expect()`.',
            example: `await expect(web.element(by.web.name('submit-button'))).toHaveText('Submit');`,
            guidelines: [
              'For web views, the text is the inner text of the element, e.g., `<h1>Welcome to the webpage!</h1>`.',
            ],
          },
          {
            signature: 'toExist()',
            description: 'Asserts that the web element exists. Used with `expect()`.',
            example: `await expect(web.element(by.web.id('error-message'))).toExist();`,
            guidelines: [
              'Verifies the presence of a web element in the DOM.',
              'Supports `asSecured()` on iOS.',
            ],
          },
          {
            signature: 'not',
            description: 'Negates the expectation for web elements.',
            example: `await expect(web.element(by.web.id('loading-spinner'))).not.toExist();`,
            guidelines: [
              'Use `not` to assert that an element should not be present.',
              'Supports `asSecured()` on iOS.',
            ],
          },
          {
            signature: 'asSecured()',
            description: 'Interacts with secured web views (iOS only).',
            example: `await web.element(by.web.label('Confirm')).asSecured().tap();`,
            guidelines: [
              'Use for web pages with secured protocols when regular interactions fail.',
              'Applicable on iOS only with specific APIs.',
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
