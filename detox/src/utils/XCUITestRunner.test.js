const XCUITestRunner = require('./XCUITestRunner');

jest.mock('./childProcess/exec');
jest.mock('./environment');

const { execWithRetriesAndLogs } = jest.requireMock('./childProcess/exec');
const environment = jest.requireMock('./environment');

describe('XCUITestRunner', () => {
    const simulatorId = 'simulator-id';
    const runner = new XCUITestRunner({ simulatorId });
    const invocationParams = { key: 'value' };
    const base64InvocationParams = Buffer.from(JSON.stringify(invocationParams)).toString('base64');
    const runnerPath = '/path/to/xcuitest-runner';

    beforeEach(() => {
        environment.getXCUITestRunnerPath.mockResolvedValue(runnerPath);
    });

    it('should execute XCUITest runner with given invocation params', async () => {
       await runner.execute(invocationParams);

         expect(execWithRetriesAndLogs).toHaveBeenCalledWith(
             `TEST_RUNNER_PARAMS="${base64InvocationParams}" xcodebuild`,
                expect.objectContaining({
                    args: expect.stringContaining(`-xctestrun ${runnerPath}`),
                }
            )
         );
    });

    it('should throw error when runner path is not found', async () => {
        environment.getXCUITestRunnerPath.mockResolvedValue(null);

        await expect(runner.execute(invocationParams)).rejects.toThrow(/XCUITest runner path could not be found/);
    });

    it('should handle execution errors and throw error with an extracted inner error', async () => {
        const errorOutput = 'DTXError: Test failure';
        const execError = { stdout: Buffer.from(errorOutput) };
        execWithRetriesAndLogs.mockRejectedValue(execError);

        await expect(runner.execute(invocationParams)).rejects.toThrow(/Test failure/);
    });

    it('should handle execution errors with no specific error message', async () => {
        const errorOutput = 'Unknown error occurred';
        const execError = { stdout: Buffer.from(errorOutput) };
        execWithRetriesAndLogs.mockRejectedValue(execError);

        await expect(runner.execute(invocationParams)).rejects
            .toThrow(/XCUITest runner failed with no error message. Runner stdout: Unknown error occurred/);
    });
});
