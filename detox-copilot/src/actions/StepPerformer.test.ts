import { StepPerformer } from '@/actions/StepPerformer';
import { PromptCreator } from '@/utils/PromptCreator';
import { CodeEvaluator } from '@/utils/CodeEvaluator';
import { SnapshotManager } from '@/utils/SnapshotManager';

jest.mock('@/utils/PromptCreator');
jest.mock('@/utils/CodeEvaluator');
jest.mock('@/utils/SnapshotManager');

describe('StepPerformer', () => {
    let stepPerformer: StepPerformer;
    let mockPromptCreator: jest.Mocked<PromptCreator>;
    let mockCodeEvaluator: jest.Mocked<CodeEvaluator>;
    let mockSnapshotManager: jest.Mocked<SnapshotManager>;
    let mockPromptHandler: jest.Mocked<PromptHandler>;

    beforeEach(() => {
        const availableAPI = { matchers: [], actions: [], assertions: [] };

        mockPromptCreator = new PromptCreator(availableAPI) as jest.Mocked<PromptCreator>;
        mockCodeEvaluator = new CodeEvaluator() as jest.Mocked<CodeEvaluator>;
        mockSnapshotManager = new SnapshotManager({} as any) as jest.Mocked<SnapshotManager>;
        mockPromptHandler = {
            runPrompt: jest.fn(),
            isSnapshotImageSupported: jest.fn().mockReturnValue(true)
        } as jest.Mocked<PromptHandler>;

        stepPerformer = new StepPerformer(
            mockPromptCreator,
            mockCodeEvaluator,
            mockSnapshotManager,
            mockPromptHandler
        );
    });

    const createStep = (value: string): ExecutionStep => ({ type: 'action', value });

    interface SetupMockOptions {
        isSnapshotSupported?: boolean;
        snapshotData?: string | null;
        viewHierarchy?: string;
        promptResult?: string;
        codeEvaluationResult?: string;
    }

    const setupMocks = ({
                            isSnapshotSupported = true,
                            snapshotData = 'snapshot_data',
                            viewHierarchy = '<view></view>',
                            promptResult = 'generated code',
                            codeEvaluationResult = 'success'
                        }: SetupMockOptions = {}) => {
        mockPromptHandler.isSnapshotImageSupported.mockReturnValue(isSnapshotSupported);
        mockSnapshotManager.captureSnapshotImage.mockResolvedValue(snapshotData as string);
        mockSnapshotManager.captureViewHierarchyString.mockResolvedValue(viewHierarchy);
        mockPromptCreator.createPrompt.mockReturnValue('generated prompt');
        mockPromptHandler.runPrompt.mockResolvedValue(promptResult);
        mockCodeEvaluator.evaluate.mockResolvedValue(codeEvaluationResult);
    };

    it('should perform a step successfully with snapshot image support', async () => {
        const step = createStep('tap button');
        setupMocks();

        const result = await stepPerformer.perform(step);

        expect(result).toBe('success');
        expect(mockPromptCreator.createPrompt).toHaveBeenCalledWith(step, '<view></view>', true, []);
        expect(mockPromptHandler.runPrompt).toHaveBeenCalledWith('generated prompt', 'snapshot_data');
        expect(mockCodeEvaluator.evaluate).toHaveBeenCalledWith('generated code');
    });

    it('should perform a step successfully without snapshot image support', async () => {
        const step = createStep('tap button');
        setupMocks({ isSnapshotSupported: false });

        const result = await stepPerformer.perform(step);

        expect(result).toBe('success');
        expect(mockPromptCreator.createPrompt).toHaveBeenCalledWith(step, '<view></view>', false, []);
    });

    it('should perform a step with null snapshot', async () => {
        const step = createStep('tap button');
        setupMocks({ snapshotData: null });

        const result = await stepPerformer.perform(step);

        expect(result).toBe('success');
        expect(mockPromptHandler.runPrompt).toHaveBeenCalledWith('generated prompt', null);
    });

    it('should perform a step successfully with previous steps', async () => {
        const step = createStep('current step');
        const previousSteps = [createStep('previous step')];
        setupMocks();

        const result = await stepPerformer.perform(step, previousSteps);

        expect(result).toBe('success');
        expect(mockPromptCreator.createPrompt).toHaveBeenCalledWith(step, '<view></view>', true, previousSteps);
    });

    it('should throw an error if code evaluation fails', async () => {
        const step = createStep('tap button');
        setupMocks();
        mockCodeEvaluator.evaluate.mockRejectedValue(new Error('Evaluation failed'));

        await expect(stepPerformer.perform(step)).rejects.toThrow('Evaluation failed');
    });
});
