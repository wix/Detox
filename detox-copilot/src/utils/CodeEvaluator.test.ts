import { CodeEvaluator } from '@/utils/CodeEvaluator';
import { CodeEvaluationError } from '@/errors/CodeEvaluationError';

describe('CodeEvaluator', () => {
    let codeEvaluator: CodeEvaluator;

    beforeEach(() => {
        codeEvaluator = new CodeEvaluator();
    });

    it('should evaluate valid code successfully', async () => {
        const validCode = 'return 2 + 2;';
        await expect(codeEvaluator.evaluate(validCode)).resolves.not.toThrow();
    });

    it('should throw CodeEvaluationError for invalid code', async () => {
        const invalidCode = 'throw new Error("Test error");';
        await expect(codeEvaluator.evaluate(invalidCode)).rejects.toThrow(CodeEvaluationError);
    });

    it('should handle asynchronous code', async () => {
        const asyncCode = 'await new Promise(resolve => setTimeout(resolve, 100)); return "done";';
        await expect(codeEvaluator.evaluate(asyncCode)).resolves.toBe('done');
    });

    it('should throw CodeEvaluationError with original error message', async () => {
        const errorCode = 'throw new Error("Custom error message");';
        await expect(codeEvaluator.evaluate(errorCode)).rejects.toThrow('Error evaluating generated code');
        await expect(codeEvaluator.evaluate(errorCode)).rejects.toThrow(CodeEvaluationError);
    });
});
