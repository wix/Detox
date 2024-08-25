import { CopilotError } from '@/errors/CopilotError';

export class CodeEvaluator {
    async evaluate(code: string): Promise<any> {
        try {
            // Wrap the code in an immediately-invoked async function expression (IIFE)
            const asyncFunction = new Function(`return (async () => { await ${code} })();`);
            await asyncFunction();
        } catch (error) {
            throw new CopilotError('Error evaluating generated code', error as Error);
        }
    }
}
