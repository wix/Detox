import { ExpectPerformer } from '@/actions/ExpectPerformer';
import { PromptCreator } from '@/utils/PromptCreator';
import { CodeEvaluator } from '@/utils/CodeEvaluator';
import { SnapshotManager } from '@/utils/SnapshotManager';

jest.mock('@/utils/PromptCreator');
jest.mock('@/utils/CodeEvaluator');
jest.mock('@/utils/SnapshotManager');

describe('ExpectPerformer', () => {
    let expectPerformer: ExpectPerformer;
    let mockPromptCreator: jest.Mocked<PromptCreator>;
    let mockCodeEvaluator: jest.Mocked<CodeEvaluator>;
    let mockSnapshotManager: jest.Mocked<SnapshotManager>;
    let mockPromptHandler: jest.Mocked<PromptHandler>;

    beforeEach(() => {
        mockPromptCreator = new PromptCreator('') as jest.Mocked<PromptCreator>;
        mockCodeEvaluator = new CodeEvaluator() as jest.Mocked<CodeEvaluator>;
        mockSnapshotManager = new SnapshotManager({} as any) as jest.Mocked<SnapshotManager>;
        mockPromptHandler = { runPrompt: jest.fn() } as jest.Mocked<PromptHandler>;

        expectPerformer = new ExpectPerformer(
            mockPromptCreator,
            mockCodeEvaluator,
            mockSnapshotManager,
            mockPromptHandler
        );
    });

    it('should perform an expectation successfully', async () => {
        const assertion = 'button is visible';
        const snapshot = 'snapshot_data';
        const viewHierarchy = '<view></view>';
        const prompt = 'generated prompt';
        const generatedCode = 'generated code';

        mockSnapshotManager.takeSnapshot.mockResolvedValue(snapshot);
        mockSnapshotManager.getViewHierarchy.mockResolvedValue(viewHierarchy);
        mockPromptCreator.createExpectPrompt.mockReturnValue(prompt);
        mockPromptHandler.runPrompt.mockResolvedValue(generatedCode);
        mockCodeEvaluator.evaluate.mockResolvedValue(true);

        const result = await expectPerformer.perform(assertion);

        expect(result).toBe(true);
        expect(mockSnapshotManager.takeSnapshot).toHaveBeenCalled();
        expect(mockSnapshotManager.getViewHierarchy).toHaveBeenCalled();
        expect(mockPromptCreator.createExpectPrompt).toHaveBeenCalledWith(assertion, viewHierarchy);
        expect(mockPromptHandler.runPrompt).toHaveBeenCalledWith(prompt, snapshot);
        expect(mockCodeEvaluator.evaluate).toHaveBeenCalledWith(generatedCode);
    });

    it('should return false for a failed expectation', async () => {
        mockSnapshotManager.takeSnapshot.mockResolvedValue('snapshot');
        mockSnapshotManager.getViewHierarchy.mockResolvedValue('<view></view>');
        mockPromptCreator.createExpectPrompt.mockReturnValue('prompt');
        mockPromptHandler.runPrompt.mockResolvedValue('code');
        mockCodeEvaluator.evaluate.mockResolvedValue(false);

        const result = await expectPerformer.perform('button is not visible');

        expect(result).toBe(false);
    });

    it('should throw an error if code evaluation fails', async () => {
        mockSnapshotManager.takeSnapshot.mockResolvedValue('snapshot');
        mockSnapshotManager.getViewHierarchy.mockResolvedValue('<view></view>');
        mockPromptCreator.createExpectPrompt.mockReturnValue('prompt');
        mockPromptHandler.runPrompt.mockResolvedValue('code');
        mockCodeEvaluator.evaluate.mockRejectedValue(new Error('Evaluation failed'));

        await expect(expectPerformer.perform('assertion')).rejects.toThrow('Evaluation failed');
    });
});
