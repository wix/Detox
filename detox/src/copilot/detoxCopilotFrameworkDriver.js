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
            guidelines: ['Always use test-ids (accessibility identifiers) from the UI hierarchy to identify elements.'],
          },
          {
            signature: 'by.text(text: string)',
            description: 'Matches elements by their text.',
            example: "element(by.text('Login'))",
            guidelines: ['Avoid using text matchers when possible; prefer test-ids.'],
          },
          {
            signature: 'by.type(type: string)',
            description: 'Matches elements by their type.',
            example: "element(by.type('RCTTextInput'))",
            guidelines: ['Use type matchers as a last resort; prefer test-ids.'],
          },
          {
            signature: 'atIndex(index: number)',
            description: 'Selects the element at the specified index from a set of matched elements.',
            example: "element(by.id('listItem')).atIndex(2)",
            guidelines: ['Use `atIndex` when multiple elements match the same matcher to select a specific one by index.'],
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
            guidelines: ["Use `element(by.id('testID'))` to locate elements."],
          },
          {
            signature: 'longPress(point?: Point2D, duration?: number)',
            description: 'Simulates long press on an element.',
            example: "await element(by.id('menuItem')).longPress();",
            guidelines: [
              'If the target element is not accessible, interact with its container or the most relevant parent element.',
              'Long-press should be called with the relevant params only, e.g. `longPress(2000)`, `longPress({ x: 100, y: 200 })` or `longPress({ x: 100, y: 200 }, 2000)`.',
            ],
          },
          {
            signature: 'multiTap(times: number)',
            description: 'Simulates multiple taps on an element.',
            example: "await element(by.id('tappable')).multiTap(3);",
            guidelines: ['All taps are applied as part of the same gesture.'],
          },
          {
            signature: 'typeText(text: string)',
            description: 'Types text into a text field.',
            example: "await element(by.id('usernameInput')).typeText('myusername');",
            guidelines: ['Typing can only be done on text field elements.'],
          },
          {
            signature: 'replaceText(text: string)',
            description: 'Replaces text in a text field.',
            example: "await element(by.id('textField')).replaceText('new text');",
            guidelines: ['Faster than `typeText()`, but may not trigger all text input callbacks.'],
          },
          {
            signature: 'clearText()',
            description: 'Clears text from a text field.',
            example: "await element(by.id('textField')).clearText();",
            guidelines: ['Use this to clear text from input fields.'],
          },
          {
            signature: 'tapReturnKey()',
            description: 'Simulates tapping the return key on the keyboard while the element is focused.',
            example: "await element(by.id('textField')).tapReturnKey();",
            guidelines: ['Use this to simulate pressing the return key while typing into a text input field.'],
          },
          {
            signature: 'tapBackspaceKey()',
            description: 'Simulates tapping the backspace key on the keyboard while the element is focused.',
            example: "await element(by.id('textField')).tapBackspaceKey();",
            guidelines: ['Use this to simulate deleting text by pressing the backspace key in a text input field.'],
          },
          {
            signature: 'adjustSliderToPosition(normalizedPosition: number)',
            description: 'Adjusts the slider to a specified position between its minimum and maximum values.',
            example: "await element(by.id('slider')).adjustSliderToPosition(0.75);",
            guidelines: ['The position is a normalized value between 0 and 1, where 0 is minimum and 1 is maximum.'],
          },
          {
            signature: 'scroll(offset: number, direction: string, startPositionX?: number, startPositionY?: number)',
            description: 'Scrolls an element.',
            example: "await element(by.id('scrollView')).scroll(100, 'down');",
            guidelines: ['Specify direction as "up", "down", "left", or "right".'],
          },
          {
            signature: 'scrollTo(edge: string)',
            description: 'Scrolls to an edge of the element.',
            example: "await element(by.id('scrollView')).scrollTo('bottom');",
            guidelines: ['Specify edge as "top", "bottom", "left", or "right".'],
          },
          {
            signature: 'scrollToIndex(index: number)',
            description: 'Scrolls the element to the specified index. (Android only)',
            example: "await element(by.id('scrollView')).scrollToIndex(10);",
            guidelines: ['Use this to scroll to a specific item in a list. Only available on Android.'],
          },
          {
            signature: 'swipe(direction: string, speed?: string, normalizedOffset?: number)',
            description: 'Simulates a swipe on the element.',
            example: "await element(by.id('scrollView')).swipe('up', 'slow', 0.5);",
            guidelines: [
              'Specify direction as "up", "down", "left", or "right".',
              'Speed can be "fast", "slow". default is "fast".',
            ],
          },
          {
            signature: 'setColumnToValue(column: number, value: string)',
            description: 'Sets a picker column to a specific value (iOS only).',
            example: "await element(by.id('pickerView')).setColumnToValue(1, '6');",
            guidelines: ['Use this for picker views on iOS.'],
          },
          {
            signature: 'setDatePickerDate(dateString: string, dateFormat: string)',
            description: 'Sets a date picker to a specific date.',
            example: "await element(by.id('datePicker')).setDatePickerDate('2023-05-25', 'yyyy-MM-dd');",
            guidelines: ['Use ISO8601 format when possible.'],
          },
          {
            signature: 'performAccessibilityAction(actionName: string)',
            description: 'Triggers an accessibility action.',
            example: "await element(by.id('scrollView')).performAccessibilityAction('activate');",
            guidelines: ['Use this to trigger specific accessibility actions.'],
          },
          {
            signature: 'pinch(scale: number, speed?: string, angle?: number)',
            description: 'Simulates a pinch gesture.',
            example: "await element(by.id('PinchableScrollView')).pinch(1.1);",
            guidelines: ['Use scale < 1 to zoom out, > 1 to zoom in.'],
          },

          {
            signature: 'getAttributes()',
            description: `
    Retrieves various attributes of the element.

    **Attributes include:**
    - **Common**: text (string), label (string), placeholder (string), enabled (boolean), identifier (string), visible (boolean), value (string | number | boolean), frame (object: x (number), y (number), width (number), height (number))
    - **iOS-only**: activationPoint (object: x (number), y (number)), normalizedActivationPoint (object: x (number), y (number)), hittable (boolean), elementFrame (object: x (number), y (number), width (number), height (number)), elementBounds (object: x (number), y (number), width (number), height (number)), safeAreaInsets (object: top (number), bottom (number), left (number), right (number)), elementSafeBounds (object: x (number), y (number), width (number), height (number)), date (Date), normalizedSliderPosition (number), contentOffset (object: x (number), y (number)), contentInset (object: top (number), bottom (number), left (number), right (number)), adjustedContentInset (object: top (number), bottom (number), left (number), right (number)))
    - **Android-only**: visibility (string: 'visible', 'invisible', 'gone'), width (number) *(deprecated)*, height (number) *(deprecated)*, elevation (number), alpha (number), focused (boolean), textSize (number), length (number)

    *Note:* Attributes may vary based on the platform and element type. If an attribute's value is null or cannot be computed, the key might be absent or contain an empty string.
  `,
            example: `
    // Retrieve attributes of an element
    const attributes = await element(by.text('Tap Me')).getAttributes();
    jestExpect(attributes.text).toBe('Tap Me');

    // Numerical assertions with allowed error range
    jestExpect(attributes.frame.x).toBeCloseTo(100, 1);
    jestExpect(attributes.frame.y).toBeCloseTo(200, 1);

    // Platform-specific attribute check
    if (device.getPlatform() === 'ios') {
      jestExpect(attributes.hittable).toBe(true);
    } else if (device.getPlatform() === 'android') {
      jestExpect(attributes.visibility).toBe('visible');
    }
  `,
            guidelines: [
              'Use this to get properties like text, value, visibility, etc., for assertions or debugging. But only if the regular matchers or assertions are not sufficient.',
              'Note that numerical values like position or size may not be very accurate; consider allowing a small error range in assertions.',
              'Check the platform using `device.getPlatform()` before using platform-specific attributes.',
              'Attributes include text, label, placeholder, enabled, identifier, visible, value, frame (with x, y, width, height), and platform-specific attributes.',
            ],
          },
          {
            signature: 'takeScreenshot(name: string)',
            description: 'Captures a screenshot of the element.',
            example: "const imagePath = await element(by.id('menuRoot')).takeScreenshot('menu_screenshot');",
            guidelines: ['Use this to capture screenshots of elements for documentation or debugging purposes.'],
          },
          {
            signature: 'longPressAndDrag(duration: number, normalizedPositionX: number, normalizedPositionY: number, targetElement: NativeElement, normalizedTargetPositionX?: number, normalizedTargetPositionY?: number, speed?: string, holdDuration?: number)',
            description: 'Simulates a long press on the element and then drags it to a target element.',
            example: "await element(by.id('draggable')).longPressAndDrag(2000, NaN, NaN, element(by.id('target')), NaN, NaN, 'fast', 0);",
            guidelines: ['Use this to simulate drag-and-drop interactions between elements.'],
          },
          {
            signature: 'launchApp(params: object)',
            description: 'Launches the app with specified parameters.',
            example: 'await device.launchApp({newInstance: true});',
            guidelines: ['Use this to launch the app with specific configurations.'],
          },
          {
            signature: 'reloadReactNative()',
            description: 'Reloads the React Native JS bundle.',
            example: 'await device.reloadReactNative();',
            guidelines: ['Faster than `launchApp()`, use when you just need to reset React Native state/logic.'],
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
            guidelines: ['Use this to check if an element is visible on the screen.'],
          },
          {
            signature: 'toExist()',
            description: 'Asserts that the element exists.',
            example: "await expect(element(by.id('username'))).toExist();",
            guidelines: ['Use this to check if an element exists in the hierarchy, even if not visible.'],
          },
          {
            signature: 'toHaveText(text: string)',
            description: 'Asserts that the element has the specified text.',
            example: "await expect(element(by.id('label'))).toHaveText('Hello, World!');",
            guidelines: ['Use this to check the text content of an element.'],
          },
          {
            signature: 'toHaveValue(value: string)',
            description: 'Asserts that the element has the specified value.',
            example: "await expect(element(by.id('slider'))).toHaveValue('0.5');",
            guidelines: ['Use this to check the value of an element.'],
          },
          {
            signature: 'toBeFocused()',
            description: 'Asserts that the element is focused.',
            example: "await expect(element(by.id('emailInput'))).toBeFocused();",
            guidelines: ['Use this to check if an element is currently focused.'],
          },
          {
            signature: 'toHaveLabel(label: string)',
            description: 'Asserts that the element has the specified accessibility label.',
            example: "await expect(element(by.id('submitButton'))).toHaveLabel('Submit');",
            guidelines: [
              'Use this to check the accessibility label of an element. Note that in React Native, the `accessibilityLabel` prop may behave differently on iOS and Android.',
            ],
          },
          {
            signature: 'toHaveId(id: string)',
            description: 'Asserts that the element has the specified accessibility identifier.',
            example: "await expect(element(by.text('Submit'))).toHaveId('submitButton');",
            guidelines: ['Use this to check the testID/accessibility identifier of an element.'],
          },
          {
            signature: 'toHaveSliderPosition(normalizedPosition: number, tolerance?: number)',
            description:
              'Asserts that the slider element has the specified normalized position [0, 1], within an optional tolerance.',
            example:
              "await expect(element(by.id('slider'))).toHaveSliderPosition(0.75);\nawait expect(element(by.id('slider'))).toHaveSliderPosition(0.3113, 0.00001);",
            guidelines: ['Use this to verify the slider\'s position. Normalized position is between 0 and 1.'],
          },
          {
            signature: 'toHaveToggleValue(value: boolean)',
            description: 'Asserts that a toggle-able element is on/checked or off/unchecked.',
            example:
              "await expect(element(by.id('switch'))).toHaveToggleValue(true);\nawait expect(element(by.id('checkbox'))).toHaveToggleValue(false);",
            guidelines: ['Use this to check the state of toggleable elements.'],
          },
          {
            signature: 'withTimeout(timeout: number)',
            description:
              'Waits until the expectation is resolved for the specified amount of time.',
            example:
              "await waitFor(element(by.id('bigButton'))).toBeVisible().withTimeout(2000);",
            guidelines: ['Use this to set a custom timeout for an expectation.'],
          },
          {
            signature: 'not',
            description: 'Negates the expectation.',
            example:
              "await expect(element(by.id('tinyButton'))).not.toBeVisible();\nawait expect(element(by.id('tinyButton'))).not.toExist();",
            guidelines: ["Use 'not' to negate an expectation."],
          },
        ],
      },
      {
        title: 'Utilities',
        items: [
          {
            signature: 'jestExpect',
            description: 'Jest expect utility for jest-assisted assertions. It is already imported in the environment.',
            example: `
    // Use jestExpect for assertions
    jestExpect(2 + 2).toBe(4);
    jestExpect('hello').toBe('hello');
    jestExpect(true).toBeTruthy();
  `,
            guidelines: ['Use jestExpect for assertions in tests, only when the default expect is not helpful for the specific case.'],
          },
        ],
      }
    ],
  },

  captureSnapshotImage: async function () {
    const fileName = `snapshot_${Date.now()}.png`;
    return await detox.device.takeScreenshot(fileName);
  },

  captureViewHierarchyString: async function () {
    return detox.device.generateViewHierarchyXml();
  },
};

module.exports = detoxCopilotFrameworkDriver;
