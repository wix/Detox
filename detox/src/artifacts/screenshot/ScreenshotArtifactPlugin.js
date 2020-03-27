const _ = require('lodash');
const TwoSnapshotsPerTestPlugin = require('../templates/plugin/TwoSnapshotsPerTestPlugin');

const allHooks = (value) => ({
  testStart: value,
  testDone: value,
});

const parsePreset = function (config) {
  switch (config) {
    case 'failing':
      return {
        enabled: true,
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: true,
      };
    case 'all':
      return {
        enabled: true,
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: false,
      };
    case 'none':
      return {
        enabled: false,
        shouldTakeAutomaticSnapshots: false,
      };
    case 'manual':
    default:
      return {
        enabled: true,
        shouldTakeAutomaticSnapshots: false,
      };
  }
};

/***
 * @abstract
 */
class ScreenshotArtifactPlugin extends TwoSnapshotsPerTestPlugin {
  constructor({ api }) {
    super({ api });
  }

  async preparePathForSnapshot(testSummary, name) {
    return this.api.preparePathForArtifact(`${name}.png`, testSummary);
  }

  static mergeConfigs(prev, nextArg) {
    const next = typeof nextArg === 'string'
      ? parsePreset(nextArg)
      : nextArg;

    if (!prev) {
      return next;
    }

    if (next) {
      const nextMerge = { ...next };
      if (_.isObject(prev.shouldTakeAutomaticSnapshots) && next.shouldTakeAutomaticSnapshots === true) {
        delete nextMerge.shouldTakeAutomaticSnapshots;
      }

      return _.merge({}, prev, nextMerge);
    }

    const result = _.defaultsDeep({}, prev, {
      enabled: true,
      shouldTakeAutomaticSnapshots: allHooks(false),
      keepOnlyFailedTestsArtifacts: false
    });

    if (_.isBoolean(result.shouldTakeAutomaticSnapshots)) {
      result.shouldTakeAutomaticSnapshots = allHooks(result.shouldTakeAutomaticSnapshots);
    }

    return result;
  }
}

module.exports = ScreenshotArtifactPlugin;
