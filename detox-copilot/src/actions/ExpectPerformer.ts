import { PromptCreator } from '@/utils/PromptCreator';
import { CodeEvaluator } from '@/utils/CodeEvaluator';
import { SnapshotManager } from '@/utils/SnapshotManager';

export class ExpectPerformer {
    constructor(
        private promptCreator: PromptCreator,
        private codeEvaluator: CodeEvaluator,
        private snapshotManager: SnapshotManager,
        private promptHandler: PromptHandler
    ) {}

    async perform(assertion: string): Promise<void> {
        const snapshot = await this.snapshotManager.takeSnapshot();
        const viewHierarchy = await this.snapshotManager.getViewHierarchy();
        const prompt = this.promptCreator.createExpectPrompt(assertion, viewHierarchy);
        const generatedCode = await this.promptHandler.runPrompt(prompt, snapshot);

        await this.codeEvaluator.evaluate(generatedCode);
    }
}
