import { ActPerformer } from '@/actions/ActPerformer';
import { PromptCreator } from '@/utils/PromptCreator';
import { CodeEvaluator } from '@/utils/CodeEvaluator';
import { SnapshotManager } from '@/utils/SnapshotManager';

jest.mock('@/utils/PromptCreator');
jest.mock('@/utils/CodeEvaluator');
jest.mock('@/utils/SnapshotManager');

describe('ActPerformer', () => {
    let actPerformer: ActPerformer;
    let mockPromptCreator: jest.Mocked<PromptCreator>;
    let mockCodeEvaluator: jest.Mocked<CodeEvaluator>;
    let mockSnapshotManager: jest.Mocked<SnapshotManager>;
    let mockPromptHandler: jest.Mocked<PromptHandler>;

    beforeEach(() => {
        mockPromptCreator = new PromptCreator('') as jest.Mocked<PromptCreator>;
        mockCodeEvaluator = new CodeEvaluator() as jest.Mocked<CodeEvaluator>;
        mockSnapshotManager = new SnapshotManager({} as any) as jest.Mocked<SnapshotManager>;
        mockPromptHandler = { runPrompt: jest.fn() } as jest.Mocked<PromptHandler>;

        actPerformer = new ActPerformer(
            mockPromptCreator,
            mockCodeEvaluator,
            mockSnapshotManager,
            mockPromptHandler
        );
    });

    it('should perform an action successfully', async () => {
        const action = 'tap button';
        const snapshot = 'snapshot_data';
        const viewHierarchy = '<view></view>';
        const prompt = 'generated prompt';
        const generatedCode = 'generated code';
        const expectedResult = "success";

        mockSnapshotManager.takeSnapshot.mockResolvedValue(snapshot);
        mockSnapshotManager.getViewHierarchy.mockResolvedValue(viewHierarchy);
        mockPromptCreator.createActPrompt.mockReturnValue(prompt);
        mockPromptHandler.runPrompt.mockResolvedValue(generatedCode);
        mockCodeEvaluator.evaluate.mockResolvedValue(expectedResult);

        const result = await actPerformer.perform(action);

        expect(result).toBe(expectedResult);
        expect(mockSnapshotManager.takeSnapshot).toHaveBeenCalled();
        expect(mockSnapshotManager.getViewHierarchy).toHaveBeenCalled();
        expect(mockPromptCreator.createActPrompt).toHaveBeenCalledWith(action, viewHierarchy);
        expect(mockPromptHandler.runPrompt).toHaveBeenCalledWith(prompt, snapshot);
        expect(mockCodeEvaluator.evaluate).toHaveBeenCalledWith(generatedCode);
    });

    it('should throw an error if code evaluation fails', async () => {
        const action = 'tap button';
        mockSnapshotManager.takeSnapshot.mockResolvedValue('snapshot');
        mockSnapshotManager.getViewHierarchy.mockResolvedValue('<view></view>');
        mockPromptCreator.createActPrompt.mockReturnValue('prompt');
        mockPromptHandler.runPrompt.mockResolvedValue('code');
        mockCodeEvaluator.evaluate.mockRejectedValue(new Error('Evaluation failed'));

        await expect(actPerformer.perform(action)).rejects.toThrow('Evaluation failed');
    });
});
