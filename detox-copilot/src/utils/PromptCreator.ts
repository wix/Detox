export class PromptCreator {
    constructor(private availableAPI: TestingFrameworkAPI) {}

    createPrompt(
        step: ExecutionStep,
        viewHierarchy: string,
        isSnapshotImageAttached: boolean,
        previousSteps: ExecutionStep[]
    ): string {
        return [
            this.createBasePrompt(),
            this.createContext(step, viewHierarchy, isSnapshotImageAttached, previousSteps),
            this.createAPIInfo(step.type),
            this.createInstructions(step, isSnapshotImageAttached)
        ]
            .flat()
            .join('\n');
    }

    private createBasePrompt(): string[] {
        return [
            "# Test Code Generation",
            "",
            "You are an AI assistant tasked with generating test code for a mobile application using the provided UI testing framework API.",
            "Please generate the minimal executable code to perform the desired intent based on the given information and context.",
            ""
        ];
    }

    private createContext(
        step: ExecutionStep,
        viewHierarchy: string,
        isSnapshotImageAttached: boolean,
        previousSteps: ExecutionStep[]
    ): string[] {
        let context = [
            "## Context",
            "",
            "### Step to perform",
            "",
            `Generate the minimal executable code to perform the following ${step.type}: "${step.value}"`,
            "",
            "### View hierarchy",
            "",
            "```",
            `${viewHierarchy}`,
            "```",
            ""
        ];

        if (isSnapshotImageAttached) {
            context.push(
                "### Snapshot image",
                "",
                "Snapshot image is attached for visual reference.",
                ""
            );
        }

        if (previousSteps.length > 0) {
            context.push(
                "### Previous steps",
                "",
                ...previousSteps.map((prevStep, index) => `${index + 1}. ${prevStep.type}: ${prevStep.value}`),
                ""
            );
        }

        return context;
    }

    private createAPIInfo(stepType: ExecutionStepType): string[] {
        const relevantAPI = stepType === 'action' ? this.availableAPI.actions : this.availableAPI.assertions;
        return [
            `## Available ${stepType.charAt(0).toUpperCase() + stepType.slice(1)} API`,
            ""
        ]
            .concat(
                relevantAPI.map(this.formatAPIMethod).flat()
            );
    }

    private formatAPIMethod(method: TestingFrameworkAPIMethod): string[] {
        const methodInfo = [
            `### ${method.signature}`,
            "",
            method.description,
            "",
            "#### Example",
            "",
            "```",
            method.example,
            "```",
            ""
        ];

        if (method.guidelines.length > 0) {
            methodInfo.push(
                "#### Guidelines",
                ...method.guidelines.map(guideline => `- ${guideline}`)
            );
        }

        return methodInfo;
    }

    private createInstructions(step: ExecutionStep, isSnapshotImageAttached: boolean): string[] {
        return [
            "## Instructions",
            "",
            [
                `Generate the minimal executable code to perform the following ${step.type}: "${step.value}"`,
                "Use the provided API and follow the guidelines.",
                "If you cannot generate the relevant code due to ambiguity, invalid prompt, or inability to find the desired element, return a code that throws an informative error explaining the problem in one sentence.",
                "Wrap the generated code with backticks, without any additional formatting.",
            ]
                .concat(this.createVisualAssertionsInstructionIfPossible(isSnapshotImageAttached))
                .map((instruction, index) => `${index + 1}. ${instruction}`).join('\n'),
            "",
            "### Examples of throwing an informative error:",
            "```typescript",
            'throw new Error("Unable to find the \'Submit\' button in the current view hierarchy.");',
            "```",
            "",
            "```typescript",
            'throw new Error("The provided prompt does not contain enough information to generate the code, \"button\" is too ambiguous for matching a specific element.");',
            "```",
            "",
            "Please provide your response below:"
        ];
    }

    private createVisualAssertionsInstructionIfPossible(isSnapshotImageAttached: boolean): string[] {
        if (!isSnapshotImageAttached) {
            return [];
        }

        return [
            "In case the expected behaviour can be tested visually based on the provided snapshot image, there's no need to generate test code for the assertion. " +
                "Instead, return code that throws an error if the visual check fails, or an empty code block if the visual check passes.",
        ];
    }
}
