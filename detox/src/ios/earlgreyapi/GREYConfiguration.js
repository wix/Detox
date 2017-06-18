
const invoke = require('../../invoke');

/**
 * An 'invoke' wrapper for https://github.com/google/EarlGrey/blob/master/EarlGrey/Common/GREYConfiguration.h
 */

/**
 *
 * @param blacklist - array of regular expressions, every matched URL will be ignored. example: [".*www\\.google\\.com", ".*www\\.youtube\\.com"]
 * @returns {*}
 */
function setURLBlacklist(blacklist) {
  return setValueForConfigKey(blacklist, 'GREYConfigKeyURLBlacklistRegex');
}

function enableSynchronization() {
  //return setValueForConfigKey(invoke.IOS.Boolean(true), 'kGREYConfigKeySynchronizationEnabled');
  return invoke.call(GREYConfigurationInstance(), 'enableSynchronization');
}

function disableSynchronization() {
  //return setValueForConfigKey(invoke.IOS.Boolean(false), 'kGREYConfigKeySynchronizationEnabled');
  return invoke.call(GREYConfigurationInstance(), 'disableSynchronization');
}

function setValueForConfigKey(value, configKey) {
  return invoke.call(GREYConfigurationInstance(), 'setValue:forConfigKey:', value, configKey);
}

function GREYConfigurationInstance() {
  return invoke.call(invoke.IOS.Class('GREYConfiguration'), 'sharedInstance');
}

module.exports = {
  setURLBlacklist,
  enableSynchronization,
  disableSynchronization
};
