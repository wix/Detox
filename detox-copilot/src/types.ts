/**
 * Interface for the testing driver that will be used to interact with the Detox framework.
 */
interface DetoxDriver {
    /**
     * Takes a snapshot of the current screen and returns the path to the saved image.
     */
    takeSnapshot: () => Promise<string>;

    /**
     * Returns the current view hierarchy in XML format.
     */
    getViewHierarchyXML: () => Promise<string>;

    /**
     * A string that describes the available API of Detox that can be used by Copilot.
     */
    availableAPI: string;
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
     * The testing driver to use for interacting with the Detox framework.
     */
    detoxDriver: DetoxDriver;

    /**
     * The prompt handler to use for interacting with the AI service
     */
    promptHandler: PromptHandler;
}
