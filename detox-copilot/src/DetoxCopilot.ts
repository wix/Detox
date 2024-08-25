import {CopilotError} from "./errors/CopilotError";

/**
 * The main Copilot class that provides AI-assisted testing capabilities for Detox.
 */
export class DetoxCopilot {
    private static instance: DetoxCopilot;
    private detoxDriver: DetoxDriver;
    private promptHandler: PromptHandler;

    private constructor(config: CopilotConfig) {
        this.detoxDriver = config.detoxDriver;
        this.promptHandler = config.promptHandler;
    }

    /**
     * Gets the singleton instance of DetoxCopilot.
     * @returns The DetoxCopilot instance.
     */
    static getInstance(): DetoxCopilot {
        if (!DetoxCopilot.instance) {
            throw new CopilotError('DetoxCopilot has not been initialized. Please call `DetoxCopilot.init()` before using it.');
        }

        return DetoxCopilot.instance;
    }

    /**
     * Initializes the Copilot with the provided configuration.
     * @param config The configuration options for Copilot.
     */
    static init(config: CopilotConfig): void {
        DetoxCopilot.instance = new DetoxCopilot(config);
    }

    /**
     * Performs an action based on the given prompt.
     * @param action The prompt describing the action to perform.
     */
    async act(action: string): Promise<void> {
        const snapshot = await this.detoxDriver.takeSnapshot();
        const viewHierarchy = await this.detoxDriver.getViewHierarchyXML();

        const prompt = `Create the Detox code to perform the following action:\n${action}\nView Hierarchy: ${viewHierarchy}\nAvailable API: ${this.detoxDriver.availableAPI}`;
        const generatedCode = await this.promptHandler.runPrompt(prompt, snapshot);

        return await this.evaluateGeneratedCode(generatedCode);
    }

    /**
     * Makes an assertion based on the given prompt.
     * @param assertion The prompt describing the assertion to make.
     * @returns A boolean indicating whether the expected assertion passed or failed.
     */
    async expect(assertion: string): Promise<boolean> {
        const snapshot = await this.detoxDriver.takeSnapshot();
        const viewHierarchy = await this.detoxDriver.getViewHierarchyXML();

        const prompt = `Create the Detox code to expect the following assertion:\n${assertion}\nView Hierarchy: ${viewHierarchy}\nAvailable API: ${this.detoxDriver.availableAPI}`;
        const generatedCode = await this.promptHandler.runPrompt(prompt, snapshot);

        return await this.evaluateGeneratedCode(generatedCode);
    }

    async evaluateGeneratedCode(generatedCode: string): Promise<any> {
        return eval(generatedCode);
    }
}
