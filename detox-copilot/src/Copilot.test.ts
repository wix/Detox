import { Copilot } from '@/Copilot';
import { ActPerformer } from '@/actions/ActPerformer';
import { ExpectPerformer } from '@/actions/ExpectPerformer';
import { CopilotError } from '@/errors/CopilotError';

jest.mock('@/actions/ActPerformer');
jest.mock('@/actions/ExpectPerformer');

describe('DetoxCopilot', () => {
    let mockConfig: any;

    beforeEach(() => {
        mockConfig = {
            detoxDriver: {
                availableAPI: 'Detox API'
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
        it('should call ActPerformer.perform with the given action', async () => {
            const action = 'tap button';
            const instance = Copilot.getInstance();
            await instance.act(action);
            expect(ActPerformer.prototype.perform).toHaveBeenCalledWith(action);
        });
    });

    describe('expect', () => {
        it('should call ExpectPerformer.perform with the given assertion', async () => {
            const assertion = 'button is visible';
            const instance = Copilot.getInstance();
            await instance.expect(assertion);
            expect(ExpectPerformer.prototype.perform).toHaveBeenCalledWith(assertion);
        });

        it('should return the result from ExpectPerformer.perform', async () => {
            (ExpectPerformer.prototype.perform as jest.Mock).mockResolvedValue(true);
            const instance = Copilot.getInstance();
            const result = await instance.expect('assertion');
            expect(result).toBe(true);
        });
    });
});
