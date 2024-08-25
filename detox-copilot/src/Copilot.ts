import {CopilotError} from "@/errors/CopilotError";
import {PromptCreator} from "@/utils/PromptCreator";
import {CodeEvaluator} from "@/utils/CodeEvaluator";
import {SnapshotManager} from "@/utils/SnapshotManager";
import {ActPerformer} from "@/actions/ActPerformer";
import {ExpectPerformer} from "@/actions/ExpectPerformer";

/**
 * The main Copilot class that provides AI-assisted testing capabilities for a given underlying testing framework.
 * @note Originally, this class is designed to work with Detox, but it can be extended to work with other frameworks.
 */
export class Copilot {
    // Singleton instance of Copilot
    static instance?: Copilot;

    private readonly promptCreator: PromptCreator;
    private readonly codeEvaluator: CodeEvaluator;
    private readonly snapshotManager: SnapshotManager;
    private actPerformer: ActPerformer;
    private expectPerformer: ExpectPerformer;

    private constructor(config: CopilotConfig) {
        this.promptCreator = new PromptCreator(config.frameworkDriver.availableAPI);
        this.codeEvaluator = new CodeEvaluator();
        this.snapshotManager = new SnapshotManager(config.frameworkDriver);
        this.actPerformer = new ActPerformer(this.promptCreator, this.codeEvaluator, this.snapshotManager, config.promptHandler);
        this.expectPerformer = new ExpectPerformer(this.promptCreator, this.codeEvaluator, this.snapshotManager, config.promptHandler);
    }

    /**
     * Gets the singleton instance of Copilot.
     * @returns The Copilot instance.
     */
    static getInstance(): Copilot {
        if (!Copilot.instance) {
            throw new CopilotError('Copilot has not been initialized. Please call the `init()` method before using it.');
        }

        return Copilot.instance;
    }

    /**
     * Initializes the Copilot with the provided configuration.
     * @param config The configuration options for Copilot.
     */
    static init(config: CopilotConfig): void {
        Copilot.instance = new Copilot(config);
    }

    /**
     * Performs an action based on the given prompt.
     * @param action The prompt describing the action to perform.
     */
    async act(action: string): Promise<any> {
        return this.actPerformer.perform(action);
    }

    /**
     * Makes an assertion based on the given prompt.
     * @param assertion The prompt describing the assertion to make.
     * @returns A boolean indicating whether the expected assertion passed or failed.
     */
    async expect(assertion: string): Promise<boolean> {
        return this.expectPerformer.perform(assertion);
    }
}
