const detox = require('../../src/index');
const runnerInfo = require('./runnerInfo');

const Reporter = runnerInfo.isJestCircus ? require('./WorkerAssignReporterCircus') : require('./WorkerAssignReporterJasmine');
module.exports = new Reporter({ detox });
