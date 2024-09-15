import { PromptCreator } from './PromptCreator';
import { TestingFrameworkAPICatalog, TestingFrameworkAPICatalogCategory, TestingFrameworkAPICatalogItem } from "@/types";

const mockAPI: TestingFrameworkAPICatalog = {
    context: {},
    categories: [
        {
            title: 'Actions',
            items: [
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
            ]
        },
        {
            title: 'Assertions',
            items: [
                {
                    signature: 'toBeVisible()',
                    description: 'Asserts that the element is visible on the screen.',
                    example: 'await expect(element(by.id("title"))).toBeVisible();',
                    guidelines: ['Consider scroll position when using this assertion.']
                }
            ]
        },
        {
            title: 'Matchers',
            items: [
                {
                    signature: 'by.id(id: string)',
                    description: 'Matches elements by their ID attribute.',
                    example: 'element(by.id("uniqueId"))',
                    guidelines: ['Use unique IDs for elements to avoid conflicts, combine with atIndex() if necessary.']
                }
            ]
        }
    ]
};

describe('PromptCreator', () => {
    let promptCreator: PromptCreator;

    beforeEach(() => {
        promptCreator = new PromptCreator(mockAPI);
    });

    it('should create a prompt for an intent correctly', () => {
        const intent = 'tap button';
        const viewHierarchy = '<View><Button testID="submit" title="Submit" /></View>';
        const prompt = promptCreator.createPrompt(intent, viewHierarchy, true, []);
        expect(prompt).toMatchSnapshot();
    });

    it('should include previous intents in the context', () => {
        const intent = 'tap button';
        const previousIntents = ['navigate to login screen', 'enter username'];
        const viewHierarchy = '<View><Button testID="submit" title="Submit" /></View>';
        const prompt = promptCreator.createPrompt(intent, viewHierarchy, false, previousIntents);
        expect(prompt).toMatchSnapshot();
    });

    it('should handle when no snapshot image is attached', () => {
        const intent = 'expect button to be visible';
        const viewHierarchy = '<View><Button testID="submit" title="Submit" /></View>';
        const prompt = promptCreator.createPrompt(intent, viewHierarchy, false, []);
        expect(prompt).toMatchSnapshot();
    });
});
