/**
 * Interface for interacting with the Copilot.
 */
export interface CopilotFacade {
    /**
     * Initializes the Copilot with the given configuration.
     * Must be called before any other Copilot methods.
     * @param config The configuration for the Copilot.
     */
    init: (config: Config) => void;

    /**
     * Resets the Copilot instance.
     * Must be called before each test to ensure a clean state (the Copilot uses the operations history as part of
     * its context).
     */
    reset: () => void;

    /**
     * Performs a testing operation or series of testing operations in the app based on the given `steps`.
     * @returns The result of the operation(s), which can be a single value or an array of values for each step.
     * @example Tap on the login button
     * @example Scroll down to the 7th item in the Events list
     * @example The welcome message should be visible
     * @example The welcome message text should be "Hello, world!"
     * @example [
     *    'Tap on the login button',
     *    'A login form should be visible',
     * ]
     */
    perform: (steps: string | string[]) => Promise<any | any[]>;
}

/**
 * Interface for the testing driver that will be used to interact with the underlying testing framework.
 */
export interface TestingFrameworkDriver {
    /**
     * Takes a snapshot of the current screen and returns the path to the saved image.
     * If the driver does not support image, return undefined.
     */
    captureSnapshotImage: () => Promise<string | undefined>;

    /**
     * Returns the current view hierarchy in a string representation.
     */
    captureViewHierarchyString: () => Promise<string>;

    /**
     * The available API methods of the testing framework.
     */
    apiCatalog: TestingFrameworkAPICatalog;
}

/**
 * Represents the available API of the testing framework that can be used by Copilot.
 * @property context The available variables of the testing framework (i.e. exposes the matching function, expect, etc.).
 * @property categories The available categories of the testing framework API.
 */
export type TestingFrameworkAPICatalog = {
    context: any;
    categories: TestingFrameworkAPICatalogCategory[];
}

/**
 * Represents a category of the API of the testing framework that can be used by Copilot.
 * @property title The title of the category.
 * @property items The items in the category.
 */
export type TestingFrameworkAPICatalogCategory = {
    title: string;
    items: TestingFrameworkAPICatalogItem[];
}

/**
 * Represents a method docs in the API of the testing framework that can be used by Copilot.
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
export type TestingFrameworkAPICatalogItem = {
    signature: string;
    description: string;
    example: string;
    guidelines: string[];
}

/**
 * Interface for the prompt handler that will be used to interact with the AI service (e.g. OpenAI).
 */
export interface PromptHandler {
    /**
     * Sends a prompt to the AI service and returns the response.
     * @param prompt The prompt to send to the AI service.
     * @param image Optional path to the image to upload to the AI service that captures the current UI state.
     * @returns The response from the AI service.
     */
    runPrompt: (prompt: string, image?: string) => Promise<string>;

    /**
     * Checks if the AI service supports snapshot images for context.
     */
    isSnapshotImageSupported: () => boolean;
}

/**
 * Configuration options for Copilot.
 */
export interface Config {
    /**
     * The testing driver to use for interacting with the underlying testing framework.
     */
    frameworkDriver: TestingFrameworkDriver;

    /**
     * The prompt handler to use for interacting with the AI service
     */
    promptHandler: PromptHandler;
}
