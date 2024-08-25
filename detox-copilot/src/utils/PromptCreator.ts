export class PromptCreator {
    constructor(private availableAPI: string) {}

    createActPrompt(action: string, viewHierarchy: string): string {
        return `Create the Detox code to perform the following action:\n${action}\nView Hierarchy: ${viewHierarchy}\nAvailable API: ${this.availableAPI}`;
    }

    createExpectPrompt(assertion: string, viewHierarchy: string): string {
        return `Create the Detox code to expect the following assertion:\n${assertion}\nView Hierarchy: ${viewHierarchy}\nAvailable API: ${this.availableAPI}`;
    }
}
