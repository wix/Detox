import { PromptCreator } from '@/utils/PromptCreator';
import { CodeEvaluator } from '@/utils/CodeEvaluator';
import { SnapshotManager } from '@/utils/SnapshotManager';
import { PromptHandler } from '@/types';
import * as fs from 'fs';
import * as path from 'path';

export class StepPerformer {
    private cache: Map<string, any> = new Map();
    private readonly cacheFilePath: string;

    constructor(
        private context: any,
        private promptCreator: PromptCreator,
        private codeEvaluator: CodeEvaluator,
        private snapshotManager: SnapshotManager,
        private promptHandler: PromptHandler,
        cacheFileName: string = 'step_performer_cache.json',
    ) {
        this.cacheFilePath = path.resolve(process.cwd(), 'copilot-cache', cacheFileName);
    }

    private getCacheKey(step: string, previous: string[]): string {
        return JSON.stringify({ step, previous });
    }

    private loadCacheFromFile(): void {
        try {
            if (fs.existsSync(this.cacheFilePath)) {
                const data = fs.readFileSync(this.cacheFilePath, 'utf-8');
                const json = JSON.parse(data);
                this.cache = new Map(Object.entries(json));
            } else {
                this.cache.clear(); // Ensure cache is empty if file doesn't exist
            }
        } catch (error) {
            console.error('Error loading cache from file:', error);
            this.cache.clear(); // Clear cache on error to avoid stale data
        }
    }

    private saveCacheToFile(): void {
        try {
            const json = Object.fromEntries(this.cache);
            fs.writeFileSync(this.cacheFilePath, JSON.stringify(json, null, 2), { flag: 'w+' });
        } catch (error) {
            console.error('Error saving cache to file:', error);
        }
    }

    async perform(step: string, previous: string[] = []): Promise<any> {
        // todo: replace with the user's logger
        console.log("\x1b[90m%s\x1b[0m%s", "Copilot performing: ", `"${step}"`);

        // Load cache before every operation
        this.loadCacheFromFile();

        const snapshot = await this.snapshotManager.captureSnapshotImage();
        const viewHierarchy = await this.snapshotManager.captureViewHierarchyString();

        const isSnapshotImageAttached =
            snapshot != null && this.promptHandler.isSnapshotImageSupported();

        const cacheKey = this.getCacheKey(step, previous);

        if (this.cache.has(cacheKey)) {
            const cachedPromptResult = this.cache.get(cacheKey);
            return this.codeEvaluator.evaluate(cachedPromptResult, this.context);
        }

        const prompt = this.promptCreator.createPrompt(
            step,
            viewHierarchy,
            isSnapshotImageAttached,
            previous,
        );

        let promptResult: string | undefined;

        try {
            promptResult = await this.promptHandler.runPrompt(prompt, snapshot);
            const result = await this.codeEvaluator.evaluate(promptResult, this.context);
            // Cache the result
            this.cache.set(cacheKey, promptResult);
            this.saveCacheToFile();
            return result;
        } catch (error) {
            // Extend 'previous' array with the failure message
            const failedAttemptMessage = promptResult
                ? `Failed to perform "${step}", tried with "${promptResult}". Should we try a different approach? If can't, throw an error.`
                : `Failed to perform "${step}", could not generate prompt result. Should we try a different approach? If can't, throw an error.`;

            const newPrevious = [...previous, failedAttemptMessage];

            const retryCacheKey = this.getCacheKey(step, newPrevious);

            if (this.cache.has(retryCacheKey)) {
                const cachedRetryPromptResult = this.cache.get(retryCacheKey);
                return this.codeEvaluator.evaluate(cachedRetryPromptResult, this.context);
            }

            const retryPrompt = this.promptCreator.createPrompt(
                step,
                viewHierarchy,
                isSnapshotImageAttached,
                newPrevious,
            );

            try {
                const retryPromptResult = await this.promptHandler.runPrompt(retryPrompt, snapshot);
                const retryResult = await this.codeEvaluator.evaluate(
                    retryPromptResult,
                    this.context,
                );
                // Cache the result under the original cache key
                this.cache.set(cacheKey, retryPromptResult);
                this.saveCacheToFile();
                return retryResult;
            } catch (retryError) {
                // Throw the original error if retry fails
                throw error;
            }
        }
    }
}
