const argparse = require('../../src/utils/argparse');
const runnerInfo = require('./runnerInfo');

if (argparse.getArgValue('reportSpecs') === 'true') {
  const Reporter = runnerInfo.isJestCircus ? require('./SpecReporterCircus') : require('./SpecReporterJasmine');
  module.exports = new Reporter();
} else {
  module.exports = {};
}
