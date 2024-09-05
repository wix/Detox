const detox = require('../..');

const detoxCopilotFrameworkDriver = {
  availableAPI: {
    context: detox,
    matchers: [
      {
        signature: 'by.id(id: string)',
        description: 'Matches elements by their test ID.',
        example: "element(by.id('loginButton'))",
        guidelines: ['Always use test-ids (accessibility identifiers) from the UI hierarchy to identify elements.']
      },
      {
        signature: 'by.text(text: string)',
        description: 'Matches elements by their text.',
        example: "element(by.text('Login'))",
        guidelines: ['Avoid using text matchers when possible, prefer test-ids.']
      },
      {
        signature: 'by.type(type: string)',
        description: 'Matches elements by their type.',
        example: "element(by.type('RCTTextInput'))",
        guidelines: ['Use type matchers as a last resort, prefer test-ids.']
      }
    ],
    actions: [
      {
        signature: 'tap(point?: Point2D)',
        description: 'Simulates tap on an element',
        example: "await element(by.id('loginButton')).tap();",
        guidelines: ['Use element(by.id(\'testID\')) to locate elements.']
      },
      {
        signature: 'longPress(point?: Point2D, duration?: number)',
        description: 'Simulates long press on an element',
        example: "await element(by.id('menuItem')).longPress();",
        guidelines: ['If the target element is not accessible, interact with its container or the most relevant parent element.']
      },
      {
        signature: 'multiTap(times: number)',
        description: 'Simulates multiple taps on an element',
        example: "await element(by.id('tappable')).multiTap(3);",
        guidelines: ['All taps are applied as part of the same gesture.']
      },
      {
        signature: 'typeText(text: string)',
        description: 'Types text into a text field',
        example: "await element(by.id('usernameInput')).typeText('myusername');",
        guidelines: ['Typing can only be done on text field elements.']
      },
      {
        signature: 'replaceText(text: string)',
        description: 'Replaces text in a text field',
        example: "await element(by.id('textField')).replaceText('new text');",
        guidelines: ['Faster than typeText(), but may not trigger all text input callbacks.']
      },
      {
        signature: 'clearText()',
        description: 'Clears text from a text field',
        example: "await element(by.id('textField')).clearText();",
        guidelines: ['Use this to clear text from input fields.']
      },
      {
        signature: 'scroll(offset: number, direction: string, startPositionX?: number, startPositionY?: number)',
        description: 'Scrolls an element',
        example: "await element(by.id('scrollView')).scroll(100, 'down');",
        guidelines: ['Specify direction as "up", "down", "left", or "right".']
      },
      {
        signature: 'scrollTo(edge: string)',
        description: 'Scrolls to an edge of the element',
        example: "await element(by.id('scrollView')).scrollTo('bottom');",
        guidelines: ['Specify edge as "top", "bottom", "left", or "right".']
      },
      {
        signature: 'swipe(direction: string, speed?: string, normalizedOffset?: number)',
        description: 'Simulates a swipe on the element',
        example: "await element(by.id('scrollView')).swipe('up', 'slow', 0.5);",
        guidelines: ['Specify direction as "up", "down", "left", or "right".']
      },
      {
        signature: 'setColumnToValue(column: number, value: string)',
        description: 'Sets a picker column to a specific value (iOS only)',
        example: "await element(by.id('pickerView')).setColumnToValue(1, '6');",
        guidelines: ['Use this for picker views on iOS.']
      },
      {
        signature: 'setDatePickerDate(dateString: string, dateFormat: string)',
        description: 'Sets a date picker to a specific date',
        example: "await element(by.id('datePicker')).setDatePickerDate('2023-05-25', 'yyyy-MM-dd');",
        guidelines: ['Use ISO8601 format when possible.']
      },
      {
        signature: 'performAccessibilityAction(actionName: string)',
        description: 'Triggers an accessibility action',
        example: "await element(by.id('scrollView')).performAccessibilityAction('activate');",
        guidelines: ['Use this to trigger specific accessibility actions.']
      },
      {
        signature: 'pinch(scale: number, speed?: string, angle?: number)',
        description: 'Simulates a pinch gesture',
        example: "await element(by.id('PinchableScrollView')).pinch(1.1);",
        guidelines: ['Use scale < 1 to zoom out, > 1 to zoom in.']
      },
      {
        signature: 'launchApp(params: object)',
        description: 'Launches the app with specified parameters',
        example: 'await device.launchApp({newInstance: true});',
        guidelines: ['Use this to launch the app with specific configurations.', 'this is part of the device API.']
      },
      {
        signature: 'reloadReactNative()',
        description: 'Reloads the React Native JS bundle',
        example: 'await device.reloadReactNative();',
        guidelines: ['Faster than launchApp(), use when you just need to reset React Native logic.', 'this is part of the device API.']
      }
    ],
    assertions: [
      {
        signature: 'toBeVisible()',
        description: 'Asserts that the element is visible',
        example: "await expect(element(by.id('loginButton'))).toBeVisible();",
        guidelines: ['Use this to check if an element is visible on the screen.']
      },
      {
        signature: 'toExist()',
        description: 'Asserts that the element exists',
        example: "await expect(element(by.id('username'))).toExist();",
        guidelines: ['Use this to check if an element exists in the hierarchy, even if not visible.']
      },
      {
        signature: 'toHaveText(text: string)',
        description: 'Asserts that the element has the specified text',
        example: "await expect(element(by.id('label'))).toHaveText('Hello, World!');",
        guidelines: ['Use this to check the text content of an element.']
      },
      {
        signature: 'toHaveValue(value: string)',
        description: 'Asserts that the element has the specified value',
        example: "await expect(element(by.id('slider'))).toHaveValue('0.5');",
        guidelines: ['Use this to check the value of an element.']
      }
    ]
  },

  captureSnapshotImage: async function() {
    const fileName = `snapshot_${Date.now()}.png`;
    return await detox.device.takeScreenshot(fileName);
  },

  captureViewHierarchyString: async function() {
    return detox.device.generateViewHierarchyXml();
  }
};

module.exports = detoxCopilotFrameworkDriver;
