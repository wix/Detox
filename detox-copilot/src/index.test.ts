import { DetoxCopilot } from './index';
import { AIAdapter, DetoxMethods, AIResponse } from './types';
import { ActionError, AssertionError, VisualAssertionError } from './errors';

describe('DetoxCopilot', () => {
    let mockAdapter: jest.MockedFunction<AIAdapter>;
    let mockDetoxMethods: jest.Mocked<DetoxMethods>;
    let copilot: DetoxCopilot;
    let mockEval: jest.SpyInstance;

    beforeEach(() => {
        mockAdapter = jest.fn();
        mockDetoxMethods = {
            takeSnapshot: jest.fn().mockResolvedValue('mock-snapshot-path'),
            dumpViewHierarchy: jest.fn().mockResolvedValue('mock-view-hierarchy'),
        };
        copilot = new DetoxCopilot(mockAdapter, mockDetoxMethods);

        // Mock eval to prevent actual code execution
        mockEval = jest.spyOn(global, 'eval').mockImplementation(() => {});
    });

    afterEach(() => {
        mockEval.mockRestore();
    });

    describe('act', () => {
        it('should execute the action successfully', async () => {
            const mockResponse: AIResponse = { type: 'code', content: 'console.log("Action executed")' };
            mockAdapter.mockResolvedValue(mockResponse);

            await expect(copilot.act('Perform action')).resolves.not.toThrow();
            expect(mockAdapter).toHaveBeenCalledWith('Perform action\nView Hierarchy: mock-view-hierarchy', undefined);
            expect(mockEval).toHaveBeenCalledWith('console.log("Action executed")');
        });

        it('should throw ActionError if AI response is not code', async () => {
            const mockResponse: AIResponse = { type: 'visual_assert_result', content: { passed: true, confidence: 1 } };
            mockAdapter.mockResolvedValue(mockResponse);

            await expect(copilot.act('Perform action')).rejects.toThrow(ActionError);
        });

        it('should retry on failure and eventually succeed', async () => {
            const mockResponse: AIResponse = { type: 'code', content: 'console.log("Action executed")' };
            mockAdapter.mockResolvedValue(mockResponse);

            mockEval
                .mockImplementationOnce(() => { throw new Error('Failure'); })
                .mockImplementationOnce(() => { throw new Error('Failure'); })
                .mockImplementationOnce(() => {});

            await expect(copilot.act('Perform action')).resolves.not.toThrow();
            expect(mockEval).toHaveBeenCalledTimes(3);
        });

        it('should throw ActionError after max retries', async () => {
            const mockResponse: AIResponse = { type: 'code', content: 'console.log("Action executed")' };
            mockAdapter.mockResolvedValue(mockResponse);

            mockEval.mockImplementation(() => { throw new Error('Persistent failure'); });

            await expect(copilot.act('Perform action')).rejects.toThrow(ActionError);
            await expect(copilot.act('Perform action')).rejects.toThrow('Failed to execute action: Persistent failure');
        });
    });

    describe('assert', () => {
        it('should execute the assertion successfully', async () => {
            const mockResponse: AIResponse = { type: 'code', content: 'expect(true).toBe(true)' };
            mockAdapter.mockResolvedValue(mockResponse);

            await expect(copilot.assert('Check condition')).resolves.not.toThrow();
            expect(mockAdapter).toHaveBeenCalledWith('Check condition\nView Hierarchy: mock-view-hierarchy', undefined);
            expect(mockEval).toHaveBeenCalledWith('expect(true).toBe(true)');
        });

        it('should throw AssertionError if AI response is not code', async () => {
            const mockResponse: AIResponse = { type: 'visual_assert_result', content: { passed: true, confidence: 1 } };
            mockAdapter.mockResolvedValue(mockResponse);

            await expect(copilot.assert('Check condition')).rejects.toThrow(AssertionError);
        });

        it('should throw AssertionError if assertion fails', async () => {
            const mockResponse: AIResponse = { type: 'code', content: 'throw new Error("Assertion failed")' };
            mockAdapter.mockResolvedValue(mockResponse);

            mockEval.mockImplementation(() => { throw new Error('Assertion failed'); });

            await expect(copilot.assert('Check condition')).rejects.toThrow(AssertionError);
            await expect(copilot.assert('Check condition')).rejects.toThrow('Assertion failed: Assertion failed');
        });
    });

    describe('visualAssert', () => {
        it('should return true for a passing visual assertion', async () => {
            const mockResponse: AIResponse = { type: 'visual_assert_result', content: { passed: true, confidence: 0.9 } };
            mockAdapter.mockResolvedValue(mockResponse);

            await expect(copilot.visualAssert('Check visual condition')).resolves.toBe(true);
            expect(mockAdapter).toHaveBeenCalledWith('Check visual condition\nView Hierarchy: mock-view-hierarchy', 'mock-snapshot-path');
        });

        it('should return false for a failing visual assertion', async () => {
            const mockResponse: AIResponse = { type: 'visual_assert_result', content: { passed: false, confidence: 0.1 } };
            mockAdapter.mockResolvedValue(mockResponse);

            await expect(copilot.visualAssert('Check visual condition')).resolves.toBe(false);
        });

        it('should throw VisualAssertionError if AI response is not a visual assert result', async () => {
            const mockResponse: AIResponse = { type: 'code', content: 'console.log("Not a visual assert result")' };
            mockAdapter.mockResolvedValue(mockResponse);

            await expect(copilot.visualAssert('Check visual condition')).rejects.toThrow(VisualAssertionError);
        });
    });

    describe('caching', () => {
        it('should cache view hierarchy', async () => {
            const mockResponse: AIResponse = { type: 'code', content: 'console.log("Action executed")' };
            mockAdapter.mockResolvedValue(mockResponse);

            await copilot.act('First action');
            await copilot.act('Second action');

            expect(mockDetoxMethods.dumpViewHierarchy).toHaveBeenCalledTimes(1);
        });

        it('should refresh cache after duration', async () => {
            const mockResponse: AIResponse = { type: 'code', content: 'console.log("Action executed")' };
            mockAdapter.mockResolvedValue(mockResponse);

            copilot = new DetoxCopilot(mockAdapter, mockDetoxMethods, { viewHierarchyCacheDuration: 100 });

            await copilot.act('First action');
            await new Promise(resolve => setTimeout(resolve, 150));
            await copilot.act('Second action');

            expect(mockDetoxMethods.dumpViewHierarchy).toHaveBeenCalledTimes(2);
        });
    });
});
