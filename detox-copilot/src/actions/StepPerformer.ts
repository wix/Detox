import { PromptCreator } from '@/utils/PromptCreator';
import { CodeEvaluator } from '@/utils/CodeEvaluator';
import { SnapshotManager } from '@/utils/SnapshotManager';
import {PromptHandler} from "@/types";

export class StepPerformer {
    constructor(
        private context: any,
        private promptCreator: PromptCreator,
        private codeEvaluator: CodeEvaluator,
        private snapshotManager: SnapshotManager,
        private promptHandler: PromptHandler,
    ) {}

    async perform(step: string, previous: string[] = []): Promise<any> {
        console.log("\x1b[36m%s\x1b[0m", `Copilot performing: \"${step}\"`);

        const snapshot = await this.snapshotManager.captureSnapshotImage();
        const viewHierarchy = await this.snapshotManager.captureViewHierarchyString();

        const isSnapshotImageAttached =
            snapshot != null && this.promptHandler.isSnapshotImageSupported();

        const prompt = this.promptCreator.createPrompt(step, viewHierarchy, isSnapshotImageAttached, previous);
        const promptResult = await this.promptHandler.runPrompt(prompt, snapshot);

        return this.codeEvaluator.evaluate(promptResult, this.context);
    }
}
