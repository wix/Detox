import { PromptCreator } from './PromptCreator';

const mockAPI: TestingFrameworkAPI = {
    actions: [
        {
            signature: 'tap(element: Element)',
            description: 'Taps on the specified element.',
            example: 'await element(by.id("button")).tap();',
            guidelines: ['Ensure the element is tappable before using this method.']
        },
        {
            signature: 'typeText(element: Element, text: string)',
            description: 'Types the specified text into the element.',
            example: 'await element(by.id("input")).typeText("Hello, World!");',
            guidelines: ['Use this method only on text input elements.']
        }
    ],
    assertions: [
        {
            signature: 'toBeVisible()',
            description: 'Asserts that the element is visible on the screen.',
            example: 'await expect(element(by.id("title"))).toBeVisible();',
            guidelines: ['Consider scroll position when using this assertion.']
        }
    ],
    matchers: [
        {
            signature: 'by.id(id: string)',
            description: 'Matches elements by their ID attribute.',
            example: 'element(by.id("uniqueId"))',
            guidelines: ['Use unique IDs for elements to avoid conflicts, combine with atIndex() if necessary.']
        }
    ]
};

describe('PromptCreator', () => {
    let promptCreator: PromptCreator;

    beforeEach(() => {
        promptCreator = new PromptCreator(mockAPI);
    });

    it('creates an action prompt correctly', () => {
        const action = 'Tap the submit button';
        const viewHierarchy = '<View><Button testID="submit" title="Submit" /></View>';
        const prompt = promptCreator.createActPrompt(action, viewHierarchy);
        expect(prompt).toMatchSnapshot();
    });

    it('creates an assertion prompt correctly', () => {
        const assertion = 'Check if the success message is visible';
        const viewHierarchy = '<View><Text testID="successMessage">Success!</Text></View>';
        const prompt = promptCreator.createExpectPrompt(assertion, viewHierarchy);
        expect(prompt).toMatchSnapshot();
    });

    it('handles long intents', () => {
        const action = 'Tap the submit button, then wait for the loading indicator to disappear, and finally verify that the success message is displayed';
        const viewHierarchy = '<View><Button testID="submit" /><ActivityIndicator testID="loader" /><Text testID="successMessage" /></View>';
        const prompt = promptCreator.createActPrompt(action, viewHierarchy);
        expect(prompt).toMatchSnapshot();
    });

    it('throws an error for invalid API', () => {
        expect(() => new PromptCreator({} as TestingFrameworkAPI)).toThrow('Invalid TestingFrameworkAPI provided');
    });
});
