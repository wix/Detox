type RankedMethod = {
    method: TestingFrameworkAPIMethod;
    relevance: number;
};

export class PromptCreator {
    constructor(private availableAPI: TestingFrameworkAPI) {
        this.validateAPI();
    }

    private validateAPI() {
        const { actions, assertions, matchers } = this.availableAPI;
        if (!actions || !assertions || !matchers) {
            throw new Error('Invalid TestingFrameworkAPI provided');
        }
    }

    private createBasePrompt(intent: string, viewHierarchy: string): string {
        return `
# Test Code Generation

Generate the JS code to "${intent}" based on the current UI state and the available API methods.

## Context

### View Hierarchy
\`\`\`
${viewHierarchy}
\`\`\`

### Image Snapshot
An image snapshot of the current UI state is attached to this prompt.

### Intent
${intent}

## Guidelines
- Use the most appropriate method(s) from the available API.
- Ensure the code is directly executable in JavaScript.
- If the operation is impossible, explain why in a brief error message (e.g. "A login button element was not found, looks like the user is already logged in").
- Consider the attached image snapshot when determining best course of action.

Return only the executable code or the error message, without any additional formatting or explanation.
        `.trim();
    }

    private rankMethods(methods: TestingFrameworkAPIMethod[], intent: string): RankedMethod[] {
        return methods
            .map(method => ({
                method,
                relevance: this.calculateSemanticSimilarity(method, intent)
            }))
            .sort((a, b) => b.relevance - a.relevance);
    }

    private calculateSemanticSimilarity(method: TestingFrameworkAPIMethod, intent: string): number {
        const methodText = `${method.signature} ${method.description} ${method.example}`;
        const commonWords = this.getCommonWords(methodText, intent);
        const methodVector = this.createVector(methodText, commonWords);
        const intentVector = this.createVector(intent, commonWords);
        return this.cosineSimilarity(methodVector, intentVector);
    }

    private getCommonWords(text1: string, text2: string): Set<string> {
        const words1 = new Set(text1.toLowerCase().split(/\s+/));
        const words2 = new Set(text2.toLowerCase().split(/\s+/));
        return new Set([...words1].filter(word => words2.has(word)));
    }

    private createVector(text: string, vocabulary: Set<string>): number[] {
        const words = text.toLowerCase().split(/\s+/);
        return Array.from(vocabulary).map(word => words.filter(w => w === word).length);
    }

    private cosineSimilarity(vec1: number[], vec2: number[]): number {
        const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
        const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
        const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
        return dotProduct / (mag1 * mag2) || 0;  // Return 0 if result is NaN
    }

    private createMethodPrompt(rankedMethod: RankedMethod): string {
        const { method, relevance } = rankedMethod;
        const guidelines = method.guidelines.length > 0
            ? `\n#### Guidelines\n${method.guidelines.map(g => `- ${g}`).join('\n')}`
            : '';

        return `
### ${method.signature}

${method.description}

#### Example
\`\`\`
${method.example}
\`\`\`
${guidelines}
        `.trim();
    }

    private createMatcherPrompt(): string {
        const matcherList = this.availableAPI.matchers
            .map(matcher => `- \`${matcher.signature}\`: ${matcher.description}`)
            .join('\n');

        return `
## Available Matchers

${matcherList}
        `.trim();
    }

    private createPrompt(intent: string, viewHierarchy: string, methodType: 'actions' | 'assertions'): string {
        const basePrompt = this.createBasePrompt(intent, viewHierarchy);
        const rankedMethods = this.rankMethods(this.availableAPI[methodType], intent);
        const suggestedMethods = rankedMethods.slice(0, 3);
        const methodPrompts = rankedMethods.map((rankedMethod, index) =>
            this.createMethodPrompt(rankedMethod, index < 3)
        ).join('\n\n');
        const matcherPrompt = this.createMatcherPrompt();

        return `
${basePrompt}

## Available Methods
${methodPrompts}

## Related Methods

3 most relevant methods, based on semantic similarity:
${suggestedMethods.map(m => `- \`${m.method.signature}\` (relevance: ${m.relevance.toFixed(2)})`).join('\n')}

${matcherPrompt}
        `.trim();
    }

    createActPrompt(action: string, viewHierarchy: string): string {
        return this.createPrompt(action, viewHierarchy, 'actions');
    }

    createExpectPrompt(assertion: string, viewHierarchy: string): string {
        return this.createPrompt(assertion, viewHierarchy, 'assertions');
    }
}
