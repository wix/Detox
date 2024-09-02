/**
 * Public API for interacting with the Copilot.
 */
export type CopilotFacade = {
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
     * Performs an action in the app.
     * @param action The action to perform (in free-form text).
     * @example Tap on the login button
     * @example Scroll down to the 7th item in the Events list
     */
    act: (action: string) => Promise<any>;

    /**
     * Asserts a condition in the app.
     * @param assertion The assertion to check (in free-form text).
     * @example The welcome message should be visible
     * @example The welcome message text should be "Hello, world!"
     */
    assert: (assertion: string) => Promise<any>;
};
