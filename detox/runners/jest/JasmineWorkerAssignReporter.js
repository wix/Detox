const { device } = require('detox'); // eslint-disable-line node/no-missing-require
const chalk = require('chalk').default;
const path = require('path');

class JasmineWorkerAssignReporter {
  suiteStarted(suiteInfo) {
    const fileName = path.basename(suiteInfo.testPath);
    this._traceln(`${chalk.whiteBright(fileName)} assigned to ${chalk.blueBright(device.name)}`);
    this._traceln('');
  }

  _trace(message) {
    process.stdout.write(message);
  }

  _traceln(message) {
    this._trace(message);
    process.stdout.write('\n');
  }
}
module.exports = JasmineWorkerAssignReporter;
