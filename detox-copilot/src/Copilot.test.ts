import { Copilot } from '@/Copilot';
import { StepPerformer } from '@/actions/StepPerformer';
import { CopilotError } from '@/errors/CopilotError';

jest.mock('@/actions/StepPerformer');

describe('Copilot', () => {
    let mockConfig: Config;

    beforeEach(() => {
        mockConfig = {
            frameworkDriver: {
                captureSnapshotImage: jest.fn(),
                captureViewHierarchyString: jest.fn(),
                availableAPI: {
                    matchers: [],
                    actions: [],
                    assertions: []
                },
            },
            promptHandler: {
                runPrompt: jest.fn(),
                isSnapshotImageSupported: jest.fn().mockReturnValue(true)
            }
        };
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.resetAllMocks();
        (console.error as jest.Mock).mockRestore();
        Copilot['instance'] = undefined;
    });

    describe('getInstance', () => {
        it('should return the same instance after initialization', () => {
            Copilot.init(mockConfig);

            const instance1 = Copilot.getInstance();
            const instance2 = Copilot.getInstance();

            expect(instance1).toBe(instance2);
        });

        it('should throw CopilotError if getInstance is called before init', () => {
            expect(() => Copilot.getInstance()).toThrow(CopilotError);
            expect(() => Copilot.getInstance()).toThrow('Copilot has not been initialized. Please call the `init()` method before using it.');
        });
    });

    describe('init', () => {
        it('should create a new instance of Copilot', () => {
            Copilot.init(mockConfig);
            expect(Copilot.getInstance()).toBeInstanceOf(Copilot);
        });

        it('should overwrite existing instance when called multiple times', () => {
            Copilot.init(mockConfig);
            const instance1 = Copilot.getInstance();

            Copilot.init(mockConfig);
            const instance2 = Copilot.getInstance();

            expect(instance1).not.toBe(instance2);
        });

        it('should throw an error if config is invalid', () => {
            const invalidConfig = {} as Config;

            expect(() => Copilot.init(invalidConfig)).toThrow();
        });
    });

    describe('execute', () => {
        it('should call StepPerformer.perform with the given step', async () => {
            Copilot.init(mockConfig);
            const instance = Copilot.getInstance();
            const step: ExecutionStep = { type: 'action', value: 'tap button' };

            await instance.perform(step);

            expect(StepPerformer.prototype.perform).toHaveBeenCalledWith(step, []);
        });

        it('should return the result from StepPerformer.perform', async () => {
            (StepPerformer.prototype.perform as jest.Mock).mockResolvedValue(true);
            Copilot.init(mockConfig);
            const instance = Copilot.getInstance();

            const result = await instance.perform({ type: 'action', value: 'tap button' });

            expect(result).toBe(true);
        });

        it('should accumulate previous steps', async () => {
            Copilot.init(mockConfig);
            const instance = Copilot.getInstance();
            const step1: ExecutionStep = { type: 'action', value: 'tap button 1' };
            const step2 : ExecutionStep = { type: 'action', value: 'tap button 2' };

            await instance.perform(step1);
            await instance.perform(step2);

            expect(StepPerformer.prototype.perform).toHaveBeenLastCalledWith(step2, [step1]);
        });
    });

    describe('reset', () => {
        it('should clear previous steps', async () => {
            Copilot.init(mockConfig);
            const instance = Copilot.getInstance();
            const step1: ExecutionStep = { type: 'action', value: 'tap button 1' };
            const step2: ExecutionStep = { type: 'action', value: 'tap button 2' };

            await instance.perform(step1);
            instance.reset();
            await instance.perform(step2);

            expect(StepPerformer.prototype.perform).toHaveBeenLastCalledWith(step2, []);
        });
    });
});
