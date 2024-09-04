import { CodeEvaluator } from '@/utils/CodeEvaluator';

describe('CodeEvaluator', () => {
    let codeEvaluator: CodeEvaluator;

    beforeEach(() => {
        codeEvaluator = new CodeEvaluator();
    });

    it('should evaluate valid code successfully', async () => {
        const validCode = 'return 2 + 2;';
        await expect(codeEvaluator.evaluate(validCode, {})).resolves.not.toThrow();
    });

    it('should evaluate valid code with comments successfully', async () => {
        const validCode = 'return 2 + 2; // This is a comment';
        await expect(codeEvaluator.evaluate(validCode, {})).resolves.not.toThrow();
    });

    it('should evaluate valid code with multiple lines successfully', async () => {
        const validCode = 'return 2 + 2;\nreturn 3 + 3;';
        await expect(codeEvaluator.evaluate(validCode, {})).resolves.not.toThrow();
    });

    it('should evaluate valid code with context successfully', async () => {
        const contextVariable = 43;
        const validCode = 'return contextVariable - 1;';
        await expect(codeEvaluator.evaluate(validCode, { contextVariable })).resolves.toBe(42);
    });

    it('should throw CodeEvaluationError for invalid code', async () => {
        const invalidCode = 'throw new Error("Test error");';
        await expect(codeEvaluator.evaluate(invalidCode, {})).rejects.toThrow(new Error('Test error'));
    });

    it('should handle asynchronous code', async () => {
        const asyncCode = 'await new Promise(resolve => setTimeout(resolve, 100)); return "done";';
        await expect(codeEvaluator.evaluate(asyncCode, {})).resolves.toBe('done');
    });

    it('should throw CodeEvaluationError with original error message', async () => {
        const errorCode = 'throw new Error("Custom error message");';
        await expect(codeEvaluator.evaluate(errorCode, {})).rejects.toThrow(new Error('Custom error message'));
    });
});
