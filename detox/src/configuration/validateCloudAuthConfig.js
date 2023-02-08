const _ = require('lodash');

const log = require('../utils/logger').child({ cat: 'config' });
/**
 * @param {{
 *  localConfig: Detox.DetoxConfiguration;
 *  errorComposer: import('../errors/DetoxConfigErrorComposer');
 *  isCloudSession: Boolean
 * }} options
 */
async function validateCloudAuthConfig(options) {
    const { errorComposer, localConfig, isCloudSession } = options;

    const cloudAuthentication = {
        ...localConfig.cloudAuthentication
    };
    if (!isCloudSession) {
        return cloudAuthentication;
    }
    if (!_.isString(cloudAuthentication.username)) {
        throw errorComposer.invalidCloudAuthProperty('username');
    }

    if (!_.isString(cloudAuthentication.accessKey)) {
        throw errorComposer.invalidCloudAuthProperty('accessKey');
    }

    const cloudSupportedCaps = ['username', 'accessKey'];
    const ignoredCloudConfigParams = _.difference(Object.keys(cloudAuthentication), cloudSupportedCaps);
    if (ignoredCloudConfigParams.length > 0)
        log.warn(`[CloudAuthenticationConfig] The properties ${ignoredCloudConfigParams.join(', ')} are not honoured for device type 'android.cloud'.`);

    return cloudAuthentication;
}

module.exports = validateCloudAuthConfig;
