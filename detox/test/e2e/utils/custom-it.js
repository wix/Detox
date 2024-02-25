const _ = require('lodash');
const rnMinorVer = require('../../../src/utils/rn-consts/rn-consts').rnVersion.minor;

const _it = {
  withFailureIf: {
    android: (spec, specFn) => runOrExpectFailByPredicates(spec, specFn, platformIs('android')),
    iOSWithRNLessThan67: (spec, specFn) => runOrExpectFailByPredicates(spec, specFn, platformIs('ios'), rnVerLessThan(67)),
  },
  skipFromRNVersion: (version) => skipFromRNVersion(version),
};

const _describe = {
  skipFromRNVersion: (version) => describeFromRNVersion(version),
}

function runOrExpectFailByPredicates(spec, specFn, ...predicateFuncs) {
  it(spec, async function() {
    if (allPredicatesTrue(predicateFuncs)) {
      await expectSpecFail(specFn);
    } else {
      await runSpec(specFn);
    }
  });
}


/**
 * Run the test only if the RN version is {version} or below. Otherwise, skip it.
 * @returns it or it.skip functions
 */
function skipFromRNVersion(version) {
  if (parseInt(rnMinorVer) <= version) {
    return it;
  } else {
    return it.skip;
  }
}

/**
 * Run the test only if the RN version is {version} or below. Otherwise, skip it.
 * @param version
 * @returns describe or describe.skip functions
 */
function describeFromRNVersion(version) {
  if (parseInt(rnMinorVer) <= version) {
    return describe;
  } else {
    return describe.skip;
  }
}

const platformIs = (platform) => () => (device.getPlatform() === platform);
const rnVerLessThan = (rnVer) => () => (rnMinorVer < rnVer);
const allPredicatesTrue = (predicateFuncs) => _.reduce(predicateFuncs, (result, predicate) => (result && predicate()), true);

async function expectSpecFail(specFn) {
  try {
    await runSpec(specFn);
  } catch (e) {
    console.log('Successfully caught an expected error:', e);
    return;
  }
  throw new Error('Ran a spec expecting an error, but no error was thrown');
}

const runSpec = (specFn) => specFn();

module.exports = {
  it: _it,
  describe: _describe,
};
