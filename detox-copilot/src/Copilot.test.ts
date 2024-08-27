import { Copilot } from '@/Copilot';
import { StepPerformer } from '@/actions/StepPerformer';
import { AssertionPerformer } from '@/actions/AssertionPerformer';
import { CopilotError } from '@/errors/CopilotError';

jest.mock('@/actions/StepPerformer');
jest.mock('@/actions/AssertionPerformer');

describe('DetoxCopilot', () => {
    let mockConfig: any;

    beforeEach(() => {
        mockConfig = {
            frameworkDriver: {
                availableAPI: {
                    matchers: [],
                    actions: [],
                    assertions: []
                },
            },
            promptHandler: {}
        };
        Copilot.init(mockConfig);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('getInstance', () => {
        it('should return the same instance after initialization', () => {
            const instance1 = Copilot.getInstance();
            const instance2 = Copilot.getInstance();
            expect(instance1).toBe(instance2);
        });

        it('should throw CopilotError if getInstance is called before init', () => {
            // @ts-ignore: Accessing private static property for testing
            Copilot.instance = undefined;
            expect(() => Copilot.getInstance()).toThrow(CopilotError);
        });
    });

    describe('act', () => {
        it('should call ActionPerformer.perform with the given action', async () => {
            const action = 'tap button';
            const instance = Copilot.getInstance();
            await instance.act(action);
            expect(StepPerformer.prototype.perform).toHaveBeenCalledWith(action);
        });

        it('should return the result from ActionPerformer.perform', async () => {
            (StepPerformer.prototype.perform as jest.Mock).mockResolvedValue(true);
            const instance = Copilot.getInstance();
            const result = await instance.act('action');
            expect(result).toBe(true);
        });
    });

    describe('assert', () => {
        it('should call AssertionPerformer.perform with the given assertion', async () => {
            const assertion = 'button is visible';
            const instance = Copilot.getInstance();
            await instance.assert(assertion);
            expect(AssertionPerformer.prototype.perform).toHaveBeenCalledWith(assertion);
        });

        it('should not return anything', async () => {
            const instance = Copilot.getInstance();
            const result = await instance.assert('assertion');
            expect(result).toBeUndefined();
        });
    });
});
