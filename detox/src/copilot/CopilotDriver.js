const { device } = require('../..');

class DetoxDriver {
  constructor() {
    this.availableAPI = {
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
          signature: 'typeText(text: string)',
          description: 'Types text into a text field',
          example: "await element(by.id('usernameInput')).typeText('myusername');",
          guidelines: ['Typing can only be done on text field elements.']
        },
        {
          signature: 'replaceText(text: string)',
          description: 'Replaces text in a text field',
          example: "await element(by.id('usernameInput')).replaceText('newusername');",
          guidelines: ['Use this to replace existing text in a field.']
        },
        {
          signature: 'clearText()',
          description: 'Clears text from a text field',
          example: "await element(by.id('usernameInput')).clearText();",
          guidelines: ['Use this to clear existing text from a field.']
        },
        {
          signature: 'scrollTo(edge: Direction, startPositionX?: number, startPositionY?: number)',
          description: 'Scrolls to an edge',
          example: "await element(by.id('scrollView')).scrollTo('bottom');",
          guidelines: ['Scrolling must be done only on scroll-view elements.']
        },
        {
          signature: 'scrollToIndex(index: Number)',
          description: 'Scrolls to a specific index',
          example: "await element(by.id('flatList')).scrollToIndex(5);",
          guidelines: ['Use this for scrolling to a specific item in a list.']
        },
        {
          signature: 'adjustSliderToPosition(newPosition: number)',
          description: 'Adjusts slider to a position',
          example: "await element(by.id('slider')).adjustSliderToPosition(0.75);",
          guidelines: ['The position should be a number between 0 and 1.']
        },
        {
          signature: 'setColumnToValue(column: number, value: string)',
          description: 'Sets picker view column to a value (iOS only)',
          example: "await element(by.id('datePicker')).setColumnToValue(1, '2023');",
          guidelines: ['This is only available on iOS.']
        },
        {
          signature: 'performAccessibilityAction(actionName: string)',
          description: 'Triggers an accessibility action',
          example: "await element(by.id('button')).performAccessibilityAction('longpress');",
          guidelines: ['Use the provided value from the intent and do not change it.']
        },
        {
          signature: 'swipe(direction: Direction, speed?: Speed, percentage?: number)',
          description: 'Swipes in the specified direction',
          example: "await element(by.id('card')).swipe('left', 'fast');",
          guidelines: ['Use this for swiping gestures on elements.']
        },
        {
          signature: 'pinch(scale: number, speed?: Speed, angle?: number)',
          description: 'Performs a pinch gesture (iOS only)',
          example: "await element(by.id('image')).pinch(0.5);",
          guidelines: ['This is only available on iOS. Scale < 1 zooms out, scale > 1 zooms in.']
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
    };
  }

  async captureSnapshotImage() {
    const fileName = `snapshot_${Date.now()}.png`;
    await device.takeScreenshot(fileName);
    return fileName;
  }

  async captureViewHierarchyString() {
    return device.generateViewHierarchyXml();
  }
}

module.exports = DetoxDriver;
