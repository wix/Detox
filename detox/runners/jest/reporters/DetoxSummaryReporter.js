/** @typedef {import('@jest/reporters').Reporter} Reporter */

const resolveFrom = require('resolve-from');
/** @type {new (globalConfig: any) => import('@jest/reporters').SummaryReporter} */
const SummaryReporter = require(resolveFrom(process.cwd(), '@jest/reporters')).SummaryReporter;

/** @implements {Partial<Reporter>} */
class DetoxSummaryReporter {
  constructor(globalConfig) {
    if (globalConfig.reporters.every(([name]) => name !== 'default' && name !== 'summary')) {
      return new SummaryReporter(globalConfig);
    }
  }
}

module.exports = DetoxSummaryReporter;
