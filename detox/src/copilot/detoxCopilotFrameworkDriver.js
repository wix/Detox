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
        signature: 'typeText(text: string)',
        description: 'Types text into a text field',
        example: "await element(by.id('usernameInput')).typeText('myusername');",
        guidelines: ['Typing can only be done on text field elements.']
      },
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
