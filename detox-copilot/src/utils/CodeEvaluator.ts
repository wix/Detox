import { CodeEvaluationError } from '@/errors/CodeEvaluationError';

export class CodeEvaluator {
    async evaluate(code: string): Promise<any> {
        const asyncFunction = this.createAsyncFunction(code);
        return await asyncFunction();
    }

    private createAsyncFunction(code: string): Function {
        const codeBlock = this.extractCodeBlock(code);

        try {
            // Wrap the code in an immediately-invoked async function expression (IIFE)
            return new Function(`return (async () => { 
              ${codeBlock}
            })();`);
        } catch (error) {
            const underlyingErrorMessage = (error as Error)?.message;
            throw new CodeEvaluationError(
                `Failed to execute test step: ${codeBlock}, error: ${underlyingErrorMessage}`
            );
        }
    }

    private extractCodeBlock(text: string): string {
        const regex = /```(?:\w*\s)?([\s\S]*?)```/;
        const match = text.match(regex);

        return (match ? match[1] : text).trim();
    }
}
