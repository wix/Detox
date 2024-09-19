import {CopilotError} from "@/errors/CopilotError";
import {PromptCreator} from "@/utils/PromptCreator";
import {CodeEvaluator} from "@/utils/CodeEvaluator";
import {SnapshotManager} from "@/utils/SnapshotManager";
import {StepPerformer} from "@/actions/StepPerformer";
import {Config} from "@/types";

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
    private previousSteps: string[] = [];
    private stepPerformer: StepPerformer;

    private constructor(config: Config) {
        this.promptCreator = new PromptCreator(config.frameworkDriver.apiCatalog);
        this.codeEvaluator = new CodeEvaluator();
        this.snapshotManager = new SnapshotManager(config.frameworkDriver);
        this.stepPerformer = new StepPerformer(
            config.frameworkDriver.apiCatalog.context,
            this.promptCreator,
            this.codeEvaluator,
            this.snapshotManager,
            config.promptHandler
        );
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
     * Initializes the Copilot with the provided configuration, must be called before using Copilot.
     * @param config The configuration options for Copilot.
     */
    static init(config: Config): void {
        Copilot.instance = new Copilot(config);
    }

    /**
     * Performs a test step based on the given prompt.
     * @param step The step describing the operation to perform.
     */
    async performStep(step: string): Promise<any> {
        const result = await this.stepPerformer.perform(step, this.previousSteps);
        this.didPerformStep(step);

        return result;
    }

    /**
     * Resets the Copilot by clearing the previous steps.
     * @note This must be called before starting a new test flow, in order to clean context from previous tests.
     */
    reset(): void {
        this.previousSteps = [];
    }

    // todo: cache the previous steps' generated test code
    private didPerformStep(step: string): void {
        this.previousSteps = [...this.previousSteps, step];
    }
}
