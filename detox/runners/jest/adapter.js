const runnerInfo = require('./runnerInfo');
const detox = require('../../src/index');
const DetoxAdapter = runnerInfo.isJestCircus ? require('./DetoxAdapterCircus') : require('./DetoxAdapterJasmine');

module.exports = new DetoxAdapter(detox);
