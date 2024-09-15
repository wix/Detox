import { StepPerformer } from '@/actions/StepPerformer';
import { PromptCreator } from '@/utils/PromptCreator';
import { CodeEvaluator } from '@/utils/CodeEvaluator';
import { SnapshotManager } from '@/utils/SnapshotManager';
import { PromptHandler, TestingFrameworkAPICatalog } from "@/types";

jest.mock('@/utils/PromptCreator');
jest.mock('@/utils/CodeEvaluator');
jest.mock('@/utils/SnapshotManager');

describe('StepPerformer', () => {
    let stepPerformer: StepPerformer;
    let mockContext: jest.Mocked<any>;
    let mockPromptCreator: jest.Mocked<PromptCreator>;
    let mockCodeEvaluator: jest.Mocked<CodeEvaluator>;
    let mockSnapshotManager: jest.Mocked<SnapshotManager>;
    let mockPromptHandler: jest.Mocked<PromptHandler>;

    beforeEach(() => {
        const apiCatalog: TestingFrameworkAPICatalog = {
            context: {},
            categories: []
        };

        mockContext = {} as jest.Mocked<any>;
        mockPromptCreator = new PromptCreator(apiCatalog) as jest.Mocked<PromptCreator>;
        mockCodeEvaluator = new CodeEvaluator() as jest.Mocked<CodeEvaluator>;
        mockSnapshotManager = new SnapshotManager({} as any) as jest.Mocked<SnapshotManager>;
        mockPromptHandler = {
            runPrompt: jest.fn(),
            isSnapshotImageSupported: jest.fn().mockReturnValue(true)
        } as jest.Mocked<PromptHandler>;

        stepPerformer = new StepPerformer(
            mockContext,
            mockPromptCreator,
            mockCodeEvaluator,
            mockSnapshotManager,
            mockPromptHandler,
        );
    });

    interface SetupMockOptions {
        isSnapshotSupported?: boolean;
        snapshotData?: string | null;
        viewHierarchy?: string;
        promptResult?: string;
        codeEvaluationResult?: any;
    }

    const setupMocks = ({
                            isSnapshotSupported = true,
                            snapshotData = 'snapshot_data',
                            viewHierarchy = '<view></view>',
                            promptResult = 'generated code',
                            codeEvaluationResult = 'success'
                        }: SetupMockOptions = {}) => {
        mockPromptHandler.isSnapshotImageSupported.mockReturnValue(isSnapshotSupported);
        mockSnapshotManager.captureSnapshotImage.mockResolvedValue(snapshotData != null ? 'snapshot_data' : undefined);
        mockSnapshotManager.captureViewHierarchyString.mockResolvedValue(viewHierarchy);
        mockPromptCreator.createPrompt.mockReturnValue('generated prompt');
        mockPromptHandler.runPrompt.mockResolvedValue(promptResult);
        mockCodeEvaluator.evaluate.mockResolvedValue(codeEvaluationResult);
    };

    it('should perform an intent successfully with snapshot image support', async () => {
        const intent = 'tap button';
        setupMocks();

        const result = await stepPerformer.perform(intent);

        expect(result).toBe('success');
        expect(mockPromptCreator.createPrompt).toHaveBeenCalledWith(intent, '<view></view>', true, []);
        expect(mockPromptHandler.runPrompt).toHaveBeenCalledWith('generated prompt', 'snapshot_data');
        expect(mockCodeEvaluator.evaluate).toHaveBeenCalledWith('generated code', mockContext);
    });

    it('should perform an intent successfully without snapshot image support', async () => {
        const intent = 'tap button';
        setupMocks({ isSnapshotSupported: false });

        const result = await stepPerformer.perform(intent);

        expect(result).toBe('success');
        expect(mockPromptCreator.createPrompt).toHaveBeenCalledWith(intent, '<view></view>', false, []);
        expect(mockPromptHandler.runPrompt).toHaveBeenCalledWith('generated prompt', 'snapshot_data');
        expect(mockCodeEvaluator.evaluate).toHaveBeenCalledWith('generated code', mockContext);
    });

    it('should perform an intent with undefined snapshot', async () => {
        const intent = 'tap button';
        setupMocks({ snapshotData: null });

        const result = await stepPerformer.perform(intent);

        expect(result).toBe('success');
        expect(mockPromptCreator.createPrompt).toHaveBeenCalledWith(intent, '<view></view>', false, []);
        expect(mockPromptHandler.runPrompt).toHaveBeenCalledWith('generated prompt', undefined);
        expect(mockCodeEvaluator.evaluate).toHaveBeenCalledWith('generated code', mockContext);
    });

    it('should perform an intent successfully with previous intents', async () => {
        const intent = 'current intent';
        const previousIntents = ['previous intent'];
        setupMocks();

        const result = await stepPerformer.perform(intent, previousIntents);

        expect(result).toBe('success');
        expect(mockPromptCreator.createPrompt).toHaveBeenCalledWith(intent, '<view></view>', true, previousIntents);
        expect(mockPromptHandler.runPrompt).toHaveBeenCalledWith('generated prompt', 'snapshot_data');
        expect(mockCodeEvaluator.evaluate).toHaveBeenCalledWith('generated code', mockContext);
    });

    it('should throw an error if code evaluation fails', async () => {
        const intent = 'tap button';
        setupMocks();
        mockCodeEvaluator.evaluate.mockRejectedValue(new Error('Evaluation failed'));

        await expect(stepPerformer.perform(intent)).rejects.toThrow('Evaluation failed');
    });
});
