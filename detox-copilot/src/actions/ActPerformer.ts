import { PromptCreator } from '@/utils/PromptCreator';
import { CodeEvaluator } from '@/utils/CodeEvaluator';
import { SnapshotManager } from '@/utils/SnapshotManager';

export class ActPerformer {
    constructor(
        private promptCreator: PromptCreator,
        private codeEvaluator: CodeEvaluator,
        private snapshotManager: SnapshotManager,
        private promptHandler: PromptHandler
    ) {}

    async perform(action: string): Promise<any> {
        const snapshot = await this.snapshotManager.takeSnapshot();
        const viewHierarchy = await this.snapshotManager.getViewHierarchy();
        const prompt = this.promptCreator.createActPrompt(action, viewHierarchy);
        const generatedCode = await this.promptHandler.runPrompt(prompt, snapshot);
        return this.codeEvaluator.evaluate(generatedCode);
    }
}
