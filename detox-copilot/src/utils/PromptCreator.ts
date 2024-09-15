import { TestingFrameworkAPICatalog, TestingFrameworkAPICatalogCategory, TestingFrameworkAPICatalogItem } from "@/types";

export class PromptCreator {
    constructor(private apiCatalog: TestingFrameworkAPICatalog) {}

    createPrompt(
        intent: string,
        viewHierarchy: string,
        isSnapshotImageAttached: boolean,
        previousIntents: string[]
    ): string {
        return [
            this.createBasePrompt(),
            this.createContext(intent, viewHierarchy, isSnapshotImageAttached, previousIntents),
            this.createAPIInfo(),
            this.createInstructions(intent, isSnapshotImageAttached)
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
        intent: string,
        viewHierarchy: string,
        isSnapshotImageAttached: boolean,
        previousIntents: string[]
    ): string[] {
        let context = [
            "## Context",
            "",
            "### Intent to perform",
            "",
            `Generate the minimal executable code to perform the following intent: "${intent}"`,
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
                "A snapshot image is attached for visual reference.",
                ""
            );
        }

        if (previousIntents.length > 0) {
            context.push(
                "### Previous intents",
                "",
                ...previousIntents.map((prevIntent, index) => `${index + 1}. ${prevIntent}`),
                ""
            );
        }

        return context;
    }

    private createAPIInfo(): string[] {
        return [
            "## Available Testing Framework API",
            ""
        ].concat(
            this.apiCatalog.categories
                .map((category) => this.formatAPICategory(category))
                .flat()
        );
    }

    private formatAPICategory(category: TestingFrameworkAPICatalogCategory): string[] {
        return [
            `### ${category.title}`,
            "",
            ...category.items.map((item) => this.formatAPIMethod(item)).flat()
        ];
    }

    private formatAPIMethod(method: TestingFrameworkAPICatalogItem): string[] {
        const methodInfo = [
            `#### ${method.signature}`,
            "",
            method.description,
            "",
            "##### Example",
            "",
            "```",
            method.example,
            "```",
            ""
        ];

        if (method.guidelines && method.guidelines.length > 0) {
            methodInfo.push(
                "##### Guidelines",
                "",
                ...method.guidelines.map((guideline) => `- ${guideline}`),
                ""
            );
        }

        return methodInfo;
    }

    private createInstructions(intent: string, isSnapshotImageAttached: boolean): string[] {
        const instructions = [
            "## Instructions",
            "",
            [
                `Generate the minimal executable code to perform the following intent: "${intent}"`,
                "Use the provided API and follow the guidelines.",
                "If you cannot generate the relevant code due to ambiguity, invalid intent, or inability to find the desired element, return code that throws an informative error explaining the problem in one sentence.",
                "Wrap the generated code with backticks, without any additional formatting."
            ]
                .concat(this.createVisualAssertionsInstructionIfPossible(isSnapshotImageAttached))
                .map((instruction, index) => `${index + 1}. ${instruction}`)
                .join('\n'),
            "",
            "### Examples of throwing an informative error:",
            "```typescript",
            'throw new Error("Unable to find the \'Submit\' button in the current view hierarchy.");',
            "```",
            "",
            "```typescript",
            'throw new Error("The provided intent does not contain enough information to generate the code; \'button\' is too ambiguous for matching a specific element.");',
            "```",
            "",
            "Please provide your response below:"
        ];

        return instructions;
    }

    private createVisualAssertionsInstructionIfPossible(isSnapshotImageAttached: boolean): string[] {
        if (!isSnapshotImageAttached) {
            return [];
        }

        return [
            "In case the expected behavior can be tested visually based on the provided snapshot image, there's no need to generate test code for the assertion. Instead, return code that throws an error if the visual check fails, or an empty code block if the visual check passes."
        ];
    }
}
