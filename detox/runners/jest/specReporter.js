const argparse = require('../../src/utils/argparse');

if (argparse.getArgValue('reportSpecs') === 'true') {
  const runnerInfo = require('./runnerInfo');
  const Reporter = runnerInfo.isJestCircus ? require('./SpecReporterCircus') : require('./SpecReporterJasmine');
  module.exports = new Reporter();
} else {
  module.exports = {};
}
