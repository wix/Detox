export type AIAdapter = (prompt: string, imagePath?: string) => Promise<AIResponse>;

export interface DetoxMethods {
    takeSnapshot: () => Promise<string>;
    dumpViewHierarchy: () => Promise<string>;
}

export interface CopilotOptions {
    viewHierarchyCacheDuration: number;
    maxRetries: number;
}

export type AIResponse =
    | { type: 'code'; content: string }
    | { type: 'visual_assert_result'; content: VisualAssertResult };

export interface VisualAssertResult {
    passed: boolean;
    confidence: number;
    details?: string;
}
