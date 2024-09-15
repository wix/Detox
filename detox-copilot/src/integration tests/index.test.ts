import copilot from "@/index";
import { Copilot } from "@/Copilot";
import { PromptHandler, TestingFrameworkDriver } from "@/types";

describe('Integration', () => {
    let mockFrameworkDriver: jest.Mocked<TestingFrameworkDriver>;
    let mockPromptHandler: jest.Mocked<PromptHandler>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockFrameworkDriver = {
            captureSnapshotImage: jest.fn().mockResolvedValue('mock_snapshot'),
            captureViewHierarchyString: jest.fn().mockResolvedValue('<view><button>Login</button></view>'),
            apiCatalog: {
                context: {},
                categories: []
            }
        };

        mockPromptHandler = {
            runPrompt: jest.fn(),
            isSnapshotImageSupported: jest.fn().mockReturnValue(true)
        };
    });

    afterEach(() => {
        // Reset Copilot instance after each test to ensure a clean state
        Copilot['instance'] = undefined;
    });

    describe('Initialization', () => {
        it('should synchronously throw an error when perform is called before initialization', () => {
            expect(() => copilot.perform('Some action')).toThrowError(
                'Copilot has not been initialized. Please call the `init()` method before using it.'
            );
        });
    });

    describe('perform method', () => {
        beforeEach(() => {
            copilot.init({
                frameworkDriver: mockFrameworkDriver,
                promptHandler: mockPromptHandler
            });
        });

        it('should successfully perform an action', async () => {
            mockPromptHandler.runPrompt.mockResolvedValue('// No operation');

            await expect(copilot.perform('Tap on the login button')).resolves.not.toThrow();

            expect(mockFrameworkDriver.captureSnapshotImage).toHaveBeenCalled();
            expect(mockFrameworkDriver.captureViewHierarchyString).toHaveBeenCalled();

            expect(mockPromptHandler.runPrompt).toHaveBeenCalledWith(
                expect.stringContaining('Tap on the login button'),
                'mock_snapshot'
            );
        });

        it('should successfully perform an assertion', async () => {
            mockPromptHandler.runPrompt.mockResolvedValue('// No operation');

            await expect(copilot.perform('The welcome message should be visible')).resolves.not.toThrow();

            expect(mockFrameworkDriver.captureSnapshotImage).toHaveBeenCalled();
            expect(mockFrameworkDriver.captureViewHierarchyString).toHaveBeenCalled();

            expect(mockPromptHandler.runPrompt).toHaveBeenCalledWith(
                expect.stringContaining('The welcome message should be visible'),
                'mock_snapshot'
            );
        });

        it('should handle errors during action execution', async () => {
            mockPromptHandler.runPrompt.mockResolvedValue('throw new Error("Element not found");');

            await expect(copilot.perform('Tap on a non-existent button')).rejects.toThrow('Element not found');
        });

        it('should handle errors during assertion execution', async () => {
            mockPromptHandler.runPrompt.mockResolvedValue('throw new Error("Element not found");');

            await expect(copilot.perform('The welcome message should be visible')).rejects.toThrow('Element not found');
        });

        it('should handle errors during code evaluation', async () => {
            mockPromptHandler.runPrompt.mockResolvedValue('foobar');

            await expect(copilot.perform('The welcome message should be visible')).rejects.toThrow(/foobar is not defined/);
        });
    });

    describe('error handling', () => {
        beforeEach(() => {
            copilot.init({
                frameworkDriver: mockFrameworkDriver,
                promptHandler: mockPromptHandler
            });
        });

        it('should throw error when PromptHandler fails', async () => {
            mockPromptHandler.runPrompt.mockRejectedValue(new Error('API error'));

            await expect(copilot.perform('Perform action')).rejects.toThrow('API error');
        });

        it('should throw error when captureSnapshotImage() fails', async () => {
            mockFrameworkDriver.captureSnapshotImage.mockRejectedValue(new Error('Snapshot error'));

            await expect(copilot.perform('Perform action')).rejects.toThrow('Snapshot error');
        });

        it('should throw error when captureViewHierarchyString() fails', async () => {
            mockFrameworkDriver.captureViewHierarchyString.mockRejectedValue(new Error('Hierarchy error'));

            await expect(copilot.perform('Perform action')).rejects.toThrow('Hierarchy error');
        });
    });
});
