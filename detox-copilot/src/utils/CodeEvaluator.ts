import { CodeEvaluationError } from '@/errors/CodeEvaluationError';

export class CodeEvaluator {
    async evaluate(code: string, context: any): Promise<any> {
        const asyncFunction = this.createAsyncFunction(code, context);
        return await asyncFunction();
    }

    private createAsyncFunction(code: string, context: any): Function {
        const codeBlock = this.extractCodeBlock(code);

        try {
            const contextValues = Object.values(context);

            // Wrap the code in an immediately-invoked async function expression (IIFE), and inject context variables into the function
            return new Function(...Object.keys(context), `return (async () => { 
              ${codeBlock}
            })();`).bind(null, ...contextValues);
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
