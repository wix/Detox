const argparse = require('../../src/utils/argparse');

if (argparse.getArgValue('reportSpecs') === 'true') {
  const Reporter = require('./JasmineSpecReporter');
  module.exports = new Reporter();
} else {
  module.exports = {};
}
