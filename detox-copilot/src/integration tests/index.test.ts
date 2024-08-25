import * as Copilot from '@/index';
import { CopilotError } from '@/errors/CopilotError';

// Mock external dependencies
jest.mock('@/utils/PromptCreator');
jest.mock('@/utils/CodeEvaluator');
jest.mock('@/utils/SnapshotManager');

describe('Copilot Integration Tests', () => {
    let mockFrameworkDriver: jest.Mocked<TestingFrameworkDriver>;
    let mockPromptHandler: jest.Mocked<PromptHandler>;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Create mock objects
        mockFrameworkDriver = {
            takeSnapshot: jest.fn().mockResolvedValue('mock_snapshot'),
            getViewHierarchy: jest.fn().mockResolvedValue('<view><button>Login</button></view>'),
            availableAPI: 'Framework API'
        };

        mockPromptHandler = {
            runPrompt: jest.fn()
        };

        // Initialize Copilot
        Copilot.init({
            frameworkDriver: mockFrameworkDriver,
            promptHandler: mockPromptHandler
        });
    });

    describe('Initialization', () => {
        beforeEach(() => {
            // Reset Copilot instance before each test
            // @ts-ignore
            Copilot['instance'] = undefined;
        });

        it('should throw an error when act is called before initialization', async () => {
            await expect(Copilot.act('Some action')).rejects.toThrow();
        });

        it('should throw an error when expect is called before initialization', async () => {
            await expect(Copilot.act('Some assertion')).rejects.toThrow();
        });
    });

    describe('act method', () => {
        it('should successfully perform an action', async () => {
            mockPromptHandler.runPrompt.mockResolvedValue('await element(by.text("Login")).tap();');

            await expect(Copilot.act('Tap on the login button')).resolves.not.toThrow();

            expect(mockFrameworkDriver.takeSnapshot).toHaveBeenCalled();
            expect(mockFrameworkDriver.getViewHierarchy).toHaveBeenCalled();
            expect(mockPromptHandler.runPrompt).toHaveBeenCalled();
        });

        it('should handle errors during action execution', async () => {
            mockPromptHandler.runPrompt.mockResolvedValue('throw new Error("Element not found");');

            await expect(Copilot.act('Tap on a non-existent button')).rejects.toThrow(CopilotError);
        });

        it('should handle complex multi-step actions', async () => {
            const complexAction = 'Log in with username "test@example.com" and password "password123"';
            const generatedCode = `
        await element(by.id('username')).typeText('test@example.com');
        await element(by.id('password')).typeText('password123');
        await element(by.text('Login')).tap();
      `;
            mockPromptHandler.runPrompt.mockResolvedValue(generatedCode);

            await expect(Copilot.act(complexAction)).resolves.not.toThrow();

            expect(mockPromptHandler.runPrompt).toHaveBeenCalledWith(
                expect.stringContaining(complexAction),
                'mock_snapshot'
            );
        });
    });

    describe('expect method', () => {
        it('should successfully perform an expectation and return true', async () => {
            mockPromptHandler.runPrompt.mockResolvedValue('return await expect(element(by.text("Welcome"))).toBeVisible();');

            const result = await Copilot.expect('The welcome message should be visible');

            expect(result).toBe(true);
            expect(mockFrameworkDriver.takeSnapshot).toHaveBeenCalled();
            expect(mockFrameworkDriver.getViewHierarchy).toHaveBeenCalled();
            expect(mockPromptHandler.runPrompt).toHaveBeenCalled();
        });

        it('should return false for a failed expectation', async () => {
            mockPromptHandler.runPrompt.mockResolvedValue('return await expect(element(by.text("Error"))).not.toBeVisible();');

            const result = await Copilot.expect('There should be no error message');

            expect(result).toBe(false);
        });

        it('should handle complex assertions', async () => {
            const complexAssertion = 'The list should contain exactly 5 items, each with a unique title';
            const generatedCode = `
        const listItems = await element(by.id('itemList')).getAttributes();
        const itemTitles = listItems.map(item => item.text);
        const uniqueTitles = new Set(itemTitles);
        return listItems.length === 5 && uniqueTitles.size === 5;
      `;
            mockPromptHandler.runPrompt.mockResolvedValue(generatedCode);

            const result = await Copilot.expect(complexAssertion);

            expect(result).toBe(true);
            expect(mockPromptHandler.runPrompt).toHaveBeenCalledWith(
                expect.stringContaining(complexAssertion),
                'mock_snapshot'
            );
        });
    });

    describe('error handling and edge cases', () => {
        it('should throw CopilotError when PromptHandler fails', async () => {
            mockPromptHandler.runPrompt.mockRejectedValue(new Error('API error'));

            await expect(Copilot.act('Perform action')).rejects.toThrow(CopilotError);
        });

        it('should handle empty view hierarchy', async () => {
            mockFrameworkDriver.getViewHierarchy.mockResolvedValue('');

            await expect(Copilot.act('Perform action')).resolves.not.toThrow();
            expect(mockPromptHandler.runPrompt).toHaveBeenCalledWith(
                expect.stringContaining('View Hierarchy:'),
                'mock_snapshot'
            );
        });

        it('should handle very long actions or assertions', async () => {
            const longAction = 'a'.repeat(1000);
            mockPromptHandler.runPrompt.mockResolvedValue('// No operation');

            await expect(Copilot.act(longAction)).resolves.not.toThrow();
            expect(mockPromptHandler.runPrompt).toHaveBeenCalledWith(
                expect.stringContaining(longAction),
                'mock_snapshot'
            );
        });
    });

    describe('multiple operations', () => {
        it('should handle a sequence of actions and expectations', async () => {
            mockPromptHandler.runPrompt
                .mockResolvedValueOnce('await element(by.text("Login")).tap();')
                .mockResolvedValueOnce('return await expect(element(by.text("Welcome"))).toBeVisible();')
                .mockResolvedValueOnce('await element(by.text("Logout")).tap();')
                .mockResolvedValueOnce('return await expect(element(by.text("Login"))).toBeVisible();');

            await Copilot.act('Tap on the login button');
            const welcomeVisible = await Copilot.expect('The welcome message should be visible');
            await Copilot.act('Tap on the logout button');
            const loginVisible = await Copilot.expect('The login button should be visible');

            expect(welcomeVisible).toBe(true);
            expect(loginVisible).toBe(true);
            expect(mockPromptHandler.runPrompt).toHaveBeenCalledTimes(4);
        });
    });
});
