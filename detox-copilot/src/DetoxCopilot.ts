import {CopilotError} from "@/errors/CopilotError";
import {PromptCreator} from "@/utils/PromptCreator";
import {CodeEvaluator} from "@/utils/CodeEvaluator";
import {SnapshotManager} from "@/utils/SnapshotManager";
import {ActPerformer} from "@/actions/ActPerformer";
import {ExpectPerformer} from "@/actions/ExpectPerformer";

/**
 * The main Copilot class that provides AI-assisted testing capabilities for Detox.
 */
export class DetoxCopilot {
    private static instance: DetoxCopilot;
    private promptCreator: PromptCreator;
    private codeEvaluator: CodeEvaluator;
    private snapshotManager: SnapshotManager;
    private actPerformer: ActPerformer;
    private expectPerformer: ExpectPerformer;

    private constructor(config: CopilotConfig) {
        this.promptCreator = new PromptCreator(config.detoxDriver.availableAPI);
        this.codeEvaluator = new CodeEvaluator();
        this.snapshotManager = new SnapshotManager(config.detoxDriver);
        this.actPerformer = new ActPerformer(this.promptCreator, this.codeEvaluator, this.snapshotManager, config.promptHandler);
        this.expectPerformer = new ExpectPerformer(this.promptCreator, this.codeEvaluator, this.snapshotManager, config.promptHandler);
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
