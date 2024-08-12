import { AIAdapter, DetoxMethods, CopilotOptions, AIResponse, VisualAssertResult } from './types';
import { CopilotError, ActionError, AssertionError, VisualAssertionError } from './errors';

export class DetoxCopilot {
    private adapter: AIAdapter;
    private detoxMethods: DetoxMethods;
    private options: CopilotOptions;
    private viewHierarchyCache: { hierarchy: string; timestamp: number } | null = null;

    constructor(adapter: AIAdapter, detoxMethods: DetoxMethods, options: Partial<CopilotOptions> = {}) {
        this.adapter = adapter;
        this.detoxMethods = detoxMethods;
        this.options = {
            viewHierarchyCacheDuration: 1000, // todo: in milliseconds
            maxRetries: 3,
            ...options
        };
    }

    /**
     * Executes an action based on the given prompt.
     * @param actionPrompt - The prompt describing the action to be performed.
     * @throws {ActionError} If the action fails to execute.
     */
    async act(actionPrompt: string): Promise<void> {
        const viewHierarchy = await this.getViewHierarchy();
        const response = await this.callAdapter(actionPrompt, viewHierarchy);

        if (response.type !== 'code') {
            throw new ActionError('AI response did not contain executable code');
        }

        try {
            await this.executeWithRetry(() => eval(response.content));
        } catch (error) {
            throw new ActionError(`Failed to execute action: ${error.message}`, error);
        }
    }

    /**
     * Performs an assertion based on the given prompt.
     * @param assertionPrompt - The prompt describing the assertion to be made.
     * @throws {AssertionError} If the assertion fails.
     */
    async assert(assertionPrompt: string): Promise<void> {
        const viewHierarchy = await this.getViewHierarchy();
        const response = await this.callAdapter(assertionPrompt, viewHierarchy);

        if (response.type !== 'code') {
            throw new AssertionError('AI response did not contain executable code');
        }

        try {
            await this.executeWithRetry(() => eval(response.content));
        } catch (error) {
            throw new AssertionError(`Assertion failed: ${error.message}`, error);
        }
    }

    /**
     * Performs a visual assertion based on the given prompt.
     * @param assertionPrompt - The prompt describing the visual assertion to be made.
     * @returns A boolean indicating whether the assertion passed or failed.
     * @throws {VisualAssertionError} If the visual assertion process fails.
     */
    async visualAssert(assertionPrompt: string): Promise<boolean> {
        const snapshotPath = await this.detoxMethods.takeSnapshot();
        const viewHierarchy = await this.getViewHierarchy();
        const response = await this.callAdapter(assertionPrompt, viewHierarchy, snapshotPath);

        if (response.type !== 'visual_assert_result') {
            throw new VisualAssertionError('AI response did not contain a valid visual assertion result');
        }

        return response.content.passed;
    }

    private async getViewHierarchy(): Promise<string> {
        const now = Date.now();
        if (this.viewHierarchyCache && now - this.viewHierarchyCache.timestamp < this.options.viewHierarchyCacheDuration) {
            return this.viewHierarchyCache.hierarchy;
        }

        const hierarchy = await this.detoxMethods.dumpViewHierarchy();
        this.viewHierarchyCache = { hierarchy, timestamp: now };
        return hierarchy;
    }

    private async callAdapter(prompt: string, viewHierarchy: string, imagePath?: string): Promise<AIResponse> {
        const fullPrompt = `${prompt}\nView Hierarchy: ${viewHierarchy}`;
        return await this.adapter(fullPrompt, imagePath);
    }

    private async executeWithRetry(fn: () => Promise<void>): Promise<void> {
        let lastError: Error | null = null;
        for (let i = 0; i < this.options.maxRetries; i++) {
            try {
                await fn();
                return;
            } catch (error) {
                lastError = error;
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
            }
        }
        throw lastError;
    }
}

export * from './types';
export * from './errors';
