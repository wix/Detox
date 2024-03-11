/** @typedef {import('@jest/reporters').Reporter} Reporter */

const resolveFrom = require('resolve-from');
/** @type {new (globalConfig: any) => import('@jest/reporters').VerboseReporter} */
const VerboseReporter = require(resolveFrom(process.cwd(), '@jest/reporters')).VerboseReporter;

/** @implements {Partial<Reporter>} */
class DetoxVerboseReporter {
  constructor(globalConfig) {
    if (globalConfig.reporters.every(([name]) => name !== 'default')) {
      return new VerboseReporter(globalConfig);
    }
  }
}

module.exports = DetoxVerboseReporter;
