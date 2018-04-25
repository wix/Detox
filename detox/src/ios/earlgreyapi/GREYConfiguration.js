const GREYConfigurationApi = require('../earlgreyapi/GREYConfigurationApi');
const GREYConfigurationDetox = require("../earlgreyapi/GREYConfigurationDetox");

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
  return GREYConfigurationDetox.enableSynchronization(GREYConfigurationInstance());
}

function disableSynchronization() {
  //return setValueForConfigKey(invoke.IOS.Boolean(false), 'kGREYConfigKeySynchronizationEnabled');
  return GREYConfigurationDetox.disableSynchronization(GREYConfigurationInstance());
}

function setValueForConfigKey(value, configKey) {
  return GREYConfigurationApi.setValueForConfigKey(GREYConfigurationInstance(), value, configKey);
}

function GREYConfigurationInstance() {
  return GREYConfigurationApi.sharedInstance();
}

module.exports = {
  setURLBlacklist,
  enableSynchronization,
  disableSynchronization
};
