export class PromptCreator {
    constructor(private availableAPI: TestingFrameworkAPI) {}

    createPrompt(
        step: ExecutionStep,
        viewHierarchy: string,
        isSnapshotImageAttached: boolean,
        previousSteps: ExecutionStep[]
    ): string {
        const sections = [
            this.createBasePrompt(),
            this.addContext(step, viewHierarchy, isSnapshotImageAttached, previousSteps),
            this.addAPIInfo(step.type),
            this.addInstructions(step)
        ];

        return sections.join('\n\n');
    }

    private createBasePrompt(): string {
        return [
            "# Detox Copilot Test Code Generation",
            "You are an AI assistant tasked with generating test code for a mobile application using the provided testing framework API.",
            "Please generate the minimal executable code to perform the desired intent based on the given information and context."
        ].join('\n');
    }

    private addContext(
        step: ExecutionStep,
        viewHierarchy: string,
        isSnapshotImageAttached: boolean,
        previousSteps: ExecutionStep[]
    ): string {
        const context = [
            "## Context",
            "### Step to perform",
            `${step.type} - ${step.value}`,
            "### View hierarchy",
            `${viewHierarchy}`,
            isSnapshotImageAttached ? "### Snapshot image attached" : ""
        ];

        if (previousSteps.length > 0) {
            context.push(
                "### Previous steps",
                ...previousSteps.map((prevStep, index) => `${index + 1}. ${prevStep.type}: ${prevStep.value}`)
            );
        }

        return context.filter(Boolean).join('\n');
    }

    private addAPIInfo(stepType: ExecutionStepType): string {
        const relevantAPI = stepType === 'action' ? this.availableAPI.actions : this.availableAPI.assertions;
        return [
            `## Available ${stepType.charAt(0).toUpperCase() + stepType.slice(1)} API`,
            ...relevantAPI.map(this.formatAPIMethod)
        ].join('\n\n');
    }

    private formatAPIMethod(method: TestingFrameworkAPIMethod): string {
        const methodInfo = [
            `### ${method.signature}`,
            method.description,
            "#### Example",
            "```",
            method.example,
            "```"
        ];

        if (method.guidelines.length > 0) {
            methodInfo.push(
                "#### Guidelines",
                ...method.guidelines.map(guideline => `- ${guideline}`)
            );
        }

        return methodInfo.join('\n');
    }

    private addInstructions(step: ExecutionStep): string {
        return [
            "## Instructions",
            `1. Generate the minimal executable code to perform the following ${step.type}:`,
            `   "${step.value}"`,
            "2. Use the provided API and follow the guidelines.",
            "3. If you cannot generate the relevant code due to ambiguity, invalid prompt, or inability to find the desired element, return a code that throws an informative error explaining the problem in one sentence.",
            "4. Wrap the generated code with backticks, without any additional formatting.",
            "",
            "Example of throwing an informative error:",
            "```typescript",
            'throw new Error("Unable to find the \'Submit\' button in the current view hierarchy.");',
            "```",
            "",
            "Please provide your response below:"
        ].join('\n');
    }
}
