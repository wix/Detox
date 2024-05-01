const { exec } = require('child-process-promise');

const DetoxRuntimeError = require('../errors/DetoxRuntimeError');
const environment = require('../utils/environment');
const log = require('../utils/logger').child({ cat: 'xcuitest-runner' });

class XCUITestRunner {
    constructor({ simulatorId }) {
        this.simulatorId = simulatorId;
    }

    async execute(invocationParams) {
        log.trace({ event: 'XCUITEST_RUNNER' }, `invocation params: ${JSON.stringify(invocationParams)}`);

        const base64InvocationParams = Buffer.from(JSON.stringify(invocationParams)).toString('base64');

        const runnerPath = await environment.getXCUITestRunnerPath();
        if (!runnerPath) {
            throw new DetoxRuntimeError({
                message: 'XCUITest runner path could not be found',
                hint: DetoxRuntimeError.reportIssue,
            });
        }

        const flags = [
            '-xctestrun', runnerPath,
            '-sdk', 'iphonesimulator',
            '-destination', `"platform=iOS Simulator,id=${this.simulatorId}"`,
            'test-without-building',
        ];

        try {
            return await exec(`TEST_RUNNER_PARAMS="${base64InvocationParams}" xcodebuild ${flags.join(' ')}`);
        } catch (e) {
            const stdout = e.stdout.toString();
            const innerError = this.findInnerError(stdout);
            throw new DetoxRuntimeError(innerError);
        }
    }

    findInnerError(stdout) {
        const match = stdout.match(/DTXError: .*/);
        return match ?
            match[0].split('DTXError: ')[1] :
            `XCUITest runner failed with no error message. Runner stdout: ${stdout}`;
    }
}

module.exports = XCUITestRunner;
