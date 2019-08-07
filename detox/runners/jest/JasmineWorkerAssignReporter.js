const detox = require('detox');
const chalk = require('chalk').default;
const path = require('path');

class JasmineWorkerAssignReporter {
  suiteStarted(suiteInfo) {
    const fileName = path.basename(suiteInfo.testPath);
    this._traceln(`${chalk.whiteBright(fileName)} assigned to ${chalk.blueBright(detox.deviceName())}`);
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
