const detox = require('../../src/index');

const runnerInfo = require('./runnerInfo');
const DetoxAdapter = runnerInfo.isJestCircus ? require('./DetoxAdapterCircus') : require('./DetoxAdapterJasmine');

module.exports = new DetoxAdapter(detox);
