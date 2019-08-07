const argparse = require('../../src/utils/argparse');

if (argparse.getArgValue('reportWorkerAssign') === 'true') {
  const Reporter = require('./JasmineWorkerAssignReporter');
  module.exports = new Reporter();
} else {
  module.exports = {};
}
