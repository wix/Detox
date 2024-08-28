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

describe('prompt creation', () => {
    let promptCreator: PromptCreator;

    beforeEach(() => {
        promptCreator = new PromptCreator(mockAPI);
    });

    it('should create an action step prompt correctly', () => {
        const step: ExecutionStep = {
            type: 'action',
            value: 'tap button'
        };

        const viewHierarchy = '<View><Button testID="submit" title="Submit" /></View>';
        const prompt = promptCreator.createPrompt(step, viewHierarchy, true, []);
        expect(prompt).toMatchSnapshot();
    });

    it('should create an assertion step with snapshot image prompt correctly', () => {
        const step: ExecutionStep = {
            type: 'assertion',
            value: 'expect button to be visible'
        };

        const viewHierarchy = '<View><Button testID="submit" title="Submit" /></View>';
        const prompt = promptCreator.createPrompt(step, viewHierarchy, true, []);
        expect(prompt).toMatchSnapshot();
    });

    it('should create an assertion step without snapshot image prompt correctly', () => {
        const step: ExecutionStep = {
            type: 'assertion',
            value: 'expect button to be visible'
        };

        const viewHierarchy = '<View><Button testID="submit" title="Submit" /></View>';
        const prompt = promptCreator.createPrompt(step, viewHierarchy, false, []);
        expect(prompt).toMatchSnapshot();
    });
});
