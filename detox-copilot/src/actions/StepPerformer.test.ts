import { StepPerformer } from '@/actions/StepPerformer';
import { PromptCreator } from '@/utils/PromptCreator';
import { CodeEvaluator } from '@/utils/CodeEvaluator';
import { SnapshotManager } from '@/utils/SnapshotManager';
import { PromptHandler, TestingFrameworkAPICatalog } from '@/types';
import * as fs from 'fs';

// Mock the 'fs' module to prevent actual file system operations during tests
jest.mock('fs');

describe('StepPerformer', () => {
    let stepPerformer: StepPerformer;
    let mockContext: jest.Mocked<any>;
    let mockPromptCreator: jest.Mocked<PromptCreator>;
    let mockCodeEvaluator: jest.Mocked<CodeEvaluator>;
    let mockSnapshotManager: jest.Mocked<SnapshotManager>;
    let mockPromptHandler: jest.Mocked<PromptHandler>;
    const cacheFileName = 'test_step_performer_cache.json';

    beforeEach(() => {
        jest.resetAllMocks();

        // Mock fs methods to prevent actual file system interactions
        (fs.existsSync as jest.Mock).mockReturnValue(false);
        (fs.readFileSync as jest.Mock).mockReturnValue('');
        (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

        const apiCatalog: TestingFrameworkAPICatalog = {
            context: {},
            categories: [],
        };

        mockContext = {} as jest.Mocked<any>;

        // Create mock instances of dependencies
        mockPromptCreator = {
            apiCatalog: apiCatalog,
            createPrompt: jest.fn(),
            createBasePrompt: jest.fn(),
            createContext: jest.fn(),
            createAPIInfo: jest.fn(),
        } as unknown as jest.Mocked<PromptCreator>;

        mockCodeEvaluator = {
            evaluate: jest.fn(),
        } as unknown as jest.Mocked<CodeEvaluator>;

        mockSnapshotManager = {
            captureSnapshotImage: jest.fn(),
            captureViewHierarchyString: jest.fn(),
        } as unknown as jest.Mocked<SnapshotManager>;

        mockPromptHandler = {
            runPrompt: jest.fn(),
            isSnapshotImageSupported: jest.fn(),
        } as jest.Mocked<PromptHandler>;

        stepPerformer = new StepPerformer(
            mockContext,
            mockPromptCreator,
            mockCodeEvaluator,
            mockSnapshotManager,
            mockPromptHandler,
            cacheFileName, // Use a test-specific cache file name
        );
    });

    interface SetupMockOptions {
        isSnapshotSupported?: boolean;
        snapshotData?: string | null;
        viewHierarchy?: string;
        promptResult?: string;
        codeEvaluationResult?: any;
        cacheExists?: boolean;
    }

    const setupMocks = ({
        isSnapshotSupported = true,
        snapshotData = 'snapshot_data',
        viewHierarchy = '<view></view>',
        promptResult = 'generated code',
        codeEvaluationResult = 'success',
        cacheExists = false,
    }: SetupMockOptions = {}) => {
        mockPromptHandler.isSnapshotImageSupported.mockReturnValue(isSnapshotSupported);
        mockSnapshotManager.captureSnapshotImage.mockResolvedValue(
            snapshotData != null ? snapshotData : undefined,
        );
        mockSnapshotManager.captureViewHierarchyString.mockResolvedValue(viewHierarchy);
        mockPromptCreator.createPrompt.mockReturnValue('generated prompt');
        mockPromptHandler.runPrompt.mockResolvedValue(promptResult);
        mockCodeEvaluator.evaluate.mockResolvedValue(codeEvaluationResult);

        // Adjust fs mocks based on cacheExists
        if (cacheExists) {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            const cacheData = {};
            const cacheKey = JSON.stringify({ step: 'tap button', previous: [] });
            // @ts-ignore
            cacheData[cacheKey] = promptResult;
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(cacheData));
        } else {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
        }
    };

    it('should perform an intent successfully with snapshot image support', async () => {
        const intent = 'tap button';
        setupMocks();

        const result = await stepPerformer.perform(intent);

        expect(result).toBe('success');
        expect(mockPromptCreator.createPrompt).toHaveBeenCalledWith(
            intent,
            '<view></view>',
            true,
            [],
        );
        expect(mockPromptHandler.runPrompt).toHaveBeenCalledWith('generated prompt', 'snapshot_data');
        expect(mockCodeEvaluator.evaluate).toHaveBeenCalledWith('generated code', mockContext);
        expect(fs.writeFileSync).toHaveBeenCalled(); // Ensure cache is saved
    });

    it('should perform an intent successfully without snapshot image support', async () => {
        const intent = 'tap button';
        setupMocks({ isSnapshotSupported: false });

        const result = await stepPerformer.perform(intent);

        expect(result).toBe('success');
        expect(mockPromptCreator.createPrompt).toHaveBeenCalledWith(
            intent,
            '<view></view>',
            false,
            [],
        );
        expect(mockPromptHandler.runPrompt).toHaveBeenCalledWith('generated prompt', 'snapshot_data');
        expect(mockCodeEvaluator.evaluate).toHaveBeenCalledWith('generated code', mockContext);
        expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should perform an intent with undefined snapshot', async () => {
        const intent = 'tap button';
        setupMocks({ snapshotData: null });

        const result = await stepPerformer.perform(intent);

        expect(result).toBe('success');
        expect(mockPromptCreator.createPrompt).toHaveBeenCalledWith(
            intent,
            '<view></view>',
            false,
            [],
        );
        expect(mockPromptHandler.runPrompt).toHaveBeenCalledWith('generated prompt', undefined);
        expect(mockCodeEvaluator.evaluate).toHaveBeenCalledWith('generated code', mockContext);
        expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should perform an intent successfully with previous intents', async () => {
        const intent = 'current intent';
        const previousIntents = ['previous intent'];
        setupMocks();

        const result = await stepPerformer.perform(intent, previousIntents);

        expect(result).toBe('success');
        expect(mockPromptCreator.createPrompt).toHaveBeenCalledWith(
            intent,
            '<view></view>',
            true,
            previousIntents,
        );
        expect(mockPromptHandler.runPrompt).toHaveBeenCalledWith('generated prompt', 'snapshot_data');
        expect(mockCodeEvaluator.evaluate).toHaveBeenCalledWith('generated code', mockContext);
        expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should throw an error if code evaluation fails', async () => {
        const intent = 'tap button';
        setupMocks();
        mockCodeEvaluator.evaluate.mockRejectedValue(new Error('Evaluation failed'));

        await expect(stepPerformer.perform(intent)).rejects.toThrow('Evaluation failed');
        expect(fs.writeFileSync).not.toHaveBeenCalled(); // Cache should not be saved
    });

    it('should use cached prompt result if available', async () => {
        const intent = 'tap button';
        setupMocks({ cacheExists: true });

        const result = await stepPerformer.perform(intent);

        expect(result).toBe('success');
        // Should not call runPrompt or createPrompt since result is cached
        expect(mockPromptCreator.createPrompt).not.toHaveBeenCalled();
        expect(mockPromptHandler.runPrompt).not.toHaveBeenCalled();
        expect(mockCodeEvaluator.evaluate).toHaveBeenCalledWith('generated code', mockContext);
        expect(fs.writeFileSync).not.toHaveBeenCalled(); // No need to save cache again
    });

    it('should retry if initial runPrompt throws an error and succeed on retry', async () => {
        const intent = 'tap button';
        setupMocks();
        const error = new Error('Initial prompt failed');
        mockPromptHandler.runPrompt.mockRejectedValueOnce(error);
        // On retry, it succeeds
        mockPromptHandler.runPrompt.mockResolvedValueOnce('retry generated code');

        const result = await stepPerformer.perform(intent);

        expect(result).toBe('success');
        expect(mockPromptCreator.createPrompt).toHaveBeenCalledTimes(2);
        expect(mockPromptHandler.runPrompt).toHaveBeenCalledTimes(2);
        expect(mockCodeEvaluator.evaluate).toHaveBeenCalledWith('retry generated code', mockContext);
        expect(fs.writeFileSync).toHaveBeenCalledTimes(1); // Cache should be saved after success
    });

    it('should throw original error if retry also fails', async () => {
        const intent = 'tap button';
        setupMocks();
        const error = new Error('Initial prompt failed');
        const retryError = new Error('Retry prompt failed');
        mockPromptHandler.runPrompt.mockRejectedValueOnce(error);
        mockPromptHandler.runPrompt.mockRejectedValueOnce(retryError);

        await expect(stepPerformer.perform(intent)).rejects.toThrow(error);
        expect(mockPromptCreator.createPrompt).toHaveBeenCalledTimes(2);
        expect(mockPromptHandler.runPrompt).toHaveBeenCalledTimes(2);
        expect(mockCodeEvaluator.evaluate).not.toHaveBeenCalled();
        expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
});
