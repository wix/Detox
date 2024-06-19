const XCUITestRunner = require('./XCUITestRunner');

jest.mock('child-process-promise', () => {
    return {
        exec: jest.fn(),
    };
});

const { exec } = jest.requireMock('child-process-promise');
const environment = jest.requireMock('../utils/environment');

jest.mock('../utils/environment');

describe('XCUITestRunner', () => {
    const runtimeDevice = { id: 'simulator-id', _bundleId: 'bundle-id' };
    const runner = new XCUITestRunner({ runtimeDevice });
    const invocationParams = { key: 'value' };
    const base64InvocationParams = Buffer.from(JSON.stringify(invocationParams)).toString('base64');
    const runnerPath = '/path/to/xcuitest-runner';

    beforeEach(() => {
        environment.getXCUITestRunnerPath.mockResolvedValue(runnerPath);
        exec.mockClear();
    });

    it('should execute XCUITest runner with given invocation params', async () => {
        const command = `TEST_RUNNER_PARAMS="${base64InvocationParams}" TEST_RUNNER_BUNDLE_ID="${runtimeDevice._bundleId}" xcodebuild -xctestrun ${runnerPath} -sdk iphonesimulator -destination "platform=iOS Simulator,id=${runtimeDevice.id}" test-without-building`;
        exec.mockResolvedValue({ stdout: 'success' });

        await runner.execute(invocationParams);

        expect(exec).toHaveBeenCalledWith(command);
    });

    it('should throw error when runner path is not found', async () => {
        environment.getXCUITestRunnerPath.mockResolvedValue(null);

        await expect(runner.execute(invocationParams)).rejects.toThrow(/XCUITest runner path could not be found/);
    });

    it('should handle execution errors and throw error with an extracted inner error', async () => {
        const errorOutput = 'DTXError: Test failure';
        exec.mockRejectedValue({ stdout: Buffer.from(errorOutput) });

        await expect(runner.execute(invocationParams)).rejects.toThrow(/Test failure/);
    });

    it('should handle execution errors with no specific error message', async () => {
        const errorOutput = 'Unknown error occurred';
        exec.mockRejectedValue({ stdout: Buffer.from(errorOutput) });

        await expect(runner.execute(invocationParams)).rejects
        .toThrow(/XCUITest runner failed with no error message. Runner stdout: Unknown error occurred/);
    });
});
