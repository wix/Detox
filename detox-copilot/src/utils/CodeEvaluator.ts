import { CodeEvaluationError } from '@/errors/CodeEvaluationError';

export class CodeEvaluator {
    async evaluate(code: string): Promise<any> {
        try {
            // Wrap the code in an immediately-invoked async function expression (IIFE)
            const asyncFunction = new Function(`return (async () => { 
              ${code}
            })();`);

            return await asyncFunction();
        } catch (error) {
            throw new CodeEvaluationError('Error evaluating generated code', error as Error);
        }
    }
}
