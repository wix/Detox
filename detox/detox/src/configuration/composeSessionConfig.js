const _ = require('lodash');

const isValidWebsocketURL = require('../utils/isValidWebsocketURL');
const log = require('../utils/logger').child({ cat: 'config' });

/**
 * @param {{
 *  cliConfig: Record<string, any>;
 *  globalConfig: Detox.DetoxConfig;
 *  localConfig: Detox.DetoxConfiguration;
 *  errorComposer: import('../errors/DetoxConfigErrorComposer');
 *  configurationName: String
 * }} options
 */
async function composeSessionConfig(options) {
  const { errorComposer, cliConfig, globalConfig, localConfig, configurationName } = options;
  const cloudSupportedCaps = ['server', 'name', 'project', 'build'];
  const session = {
    ...globalConfig.session,
    ...localConfig.session,
  };

  if (session.server != null) {
    const value = session.server;
    if (typeof value !== 'string' || !isValidWebsocketURL(value)) {
      throw errorComposer.invalidServerProperty();
    }
  }

  if (session.sessionId != null) {
    const value = session.sessionId;
    if (typeof value !== 'string' || value.length === 0) {
      throw errorComposer.invalidSessionIdProperty();
    }
  }

  if (session.debugSynchronization != null) {
    const value = session.debugSynchronization;
    if (typeof value !== 'number' || value < 0) {
      throw errorComposer.invalidDebugSynchronizationProperty();
    }
  }

  if (Number.parseInt(cliConfig.debugSynchronization, 10) >= 0) {
    session.debugSynchronization = +cliConfig.debugSynchronization;
  }

  if (configurationName === 'android.cloud.release') {
    if (session.build != null) {
      const value = session.build;
      if (typeof value !== 'string' || value.length === 0) {
        throw errorComposer.invalidCloudSessionProperty('build');
      }
    }
    if (session.project != null) {
      const value = session.project;
      if (typeof value !== 'string' || value.length === 0) {
        throw errorComposer.invalidCloudSessionProperty('project');
      }
    }
    if (session.name != null) {
      const value = session.name;
      if (typeof value !== 'string' || value.length === 0) {
        throw errorComposer.invalidCloudSessionProperty('name');
      }
    }
    const ignoredCloudConfigParams = _.difference(Object.keys(session), cloudSupportedCaps);
    if (ignoredCloudConfigParams.length > 0)
      log.warn(`[SessionConfig] The properties ${ignoredCloudConfigParams.join(', ')} are not honoured for device type 'android.cloud'.`);
  }

  const result = {
    autoStart: !session.server,
    debugSynchronization: 10000,

    ...session,
  };
  // Are we supporting or ignoring debugSynchronization

  if (!result.server && !result.autoStart) {
    throw errorComposer.cannotSkipAutostartWithMissingServer();
  }

  return result;
}

module.exports = composeSessionConfig;
