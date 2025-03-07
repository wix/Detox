const DetoxRuntimeError = require('../errors/DetoxRuntimeError');
const { execAsync } = require('../utils/childProcess');
const environment = require('../utils/environment');
const log = require('../utils/logger').child({ cat: 'xcuitest-runner' });

class XCUITestRunner {
    constructor({ runtimeDevice }) {
        this.runtimeDevice = runtimeDevice;
    }

    async execute(invocationParams) {
        log.trace(
          { event: 'XCUITEST_RUNNER' },
          'invocation params: %j, simulator id: %s, bundle id: %s', invocationParams, this.runtimeDevice.id, this.runtimeDevice._bundleId
        );

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
            '-destination', `"platform=iOS Simulator,id=${this.runtimeDevice.id}"`,
            'test-without-building',
        ];

        log.info(`Running XUICTest runner. See target logs using:\n` +
          `\t/usr/bin/xcrun simctl spawn ${this.runtimeDevice.id} log stream --level debug --style compact ` +
          `--predicate 'process == "DetoxXCUITestRunner-Runner" && subsystem == "com.wix.DetoxXCUITestRunner.xctrunner"'`);

        try {
            return await execAsync(`TEST_RUNNER_PARAMS="${base64InvocationParams}" TEST_RUNNER_BUNDLE_ID="${this.runtimeDevice._bundleId}" xcodebuild ${flags.join(' ')}`);
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
