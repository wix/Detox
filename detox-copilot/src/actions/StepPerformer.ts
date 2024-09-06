import { PromptCreator } from '@/utils/PromptCreator';
import { CodeEvaluator } from '@/utils/CodeEvaluator';
import { SnapshotManager } from '@/utils/SnapshotManager';

export class StepPerformer {
    constructor(
        private promptCreator: PromptCreator,
        private codeEvaluator: CodeEvaluator,
        private snapshotManager: SnapshotManager,
        private promptHandler: PromptHandler
    ) {}
        async perform(step: ExecutionStep, previous: ExecutionStep[] = []): Promise<any> {
        const snapshot = await this.snapshotManager.captureSnapshotImage();
        const viewHierarchy = await this.snapshotManager.captureViewHierarchyString();

        const isSnapshotImageAttached =
            snapshot !== undefined && this.promptHandler.isSnapshotImageSupported();

        const prompt = this.promptCreator.createPrompt(step, viewHierarchy, isSnapshotImageAttached, previous);
        const promptResult = await this.promptHandler.runPrompt(prompt, snapshot);

        return this.codeEvaluator.evaluate(promptResult);
    }
}
