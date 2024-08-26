/**
 * Interface for the testing driver that will be used to interact with the underlying testing framework.
 */
interface TestingFrameworkDriver {
    /**
     * Takes a snapshot of the current screen and returns the path to the saved image.
     */
    takeSnapshot: () => Promise<string>;

    /**
     * Returns the current view hierarchy in a string representation.
     */
    getViewHierarchy: () => Promise<string>;

    /**
     * The available API methods of the testing framework.
     */
    availableAPI: TestingFrameworkAPI;
}

/**
 * Represents the API of the testing framework that can be used by Copilot.
 * @property matchers The available matchers API of the testing framework.
 * @property actions The available actions API of the testing framework.
 * @property assertions The available assertions API of the testing framework.
 */
type TestingFrameworkAPI = {
    matchers: TestingFrameworkAPIMethod[];
    actions: TestingFrameworkAPIMethod[];
    assertions: TestingFrameworkAPIMethod[];
}

/**
 * Represents a method in the API of the testing framework that can be used by Copilot.
 * @property signature The method signature of the API.
 * @property description A description of the API.
 * @property example An example of how to use the API.
 * @property guidelines An optional list of related guidelines for the API.
 *
 * @example
 * {
 *    signature: 'type(text: string)',
 *    description: 'Types the given text into the target element.',
 *    example: 'await element(by.id("username")).type("john_doe");',
 *    guidelines: [
 *      'Typing can only be done on text field elements.',
 *      'If the target is not a text field, find the nearest parent or child that is a text field.'
 *    ]
 * };
 */
type TestingFrameworkAPIMethod = {
    signature: string;
    description: string;
    example: string;
    guidelines: string[];
}

/**
 * Interface for the prompt handler that will be used to interact with the AI service (e.g. OpenAI).
 */
interface PromptHandler {
    /**
     * Sends a prompt to the AI service and returns the response.
     * @param prompt The prompt to send to the AI service.
     * @param image The path to the image to upload to the AI service.
     * @returns The response from the AI service.
     */
    runPrompt: (prompt: string, image: string) => Promise<string>;
}

/**
 * Configuration options for Copilot.
 */
interface CopilotConfig {
    /**
     * The testing driver to use for interacting with the underlying testing framework.
     */
    frameworkDriver: TestingFrameworkDriver;

    /**
     * The prompt handler to use for interacting with the AI service
     */
    promptHandler: PromptHandler;
}
