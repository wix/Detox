const isValidWebsocketURL = require('../utils/isValidWebsocketURL');

/**
 * @param {{
 *  cliConfig: Record<string, any>;
 *  globalConfig: Detox.DetoxConfig;
 *  localConfig: Detox.DetoxConfiguration;
 *  errorComposer: import('../errors/DetoxConfigErrorComposer');
 * }} options
 */
async function composeSessionConfig(options) {
  const { errorComposer, cliConfig, globalConfig, localConfig } = options;

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

  if (session.ignoreUnexpectedMessages != null) {
    const value = session.ignoreUnexpectedMessages;
    if (typeof value !== 'boolean') {
      throw errorComposer.invalidIgnoreUnexpectedMessagesProperty();
    }
  }

  if (Number.parseInt(cliConfig.debugSynchronization, 10) >= 0) {
    session.debugSynchronization = +cliConfig.debugSynchronization;
  }

  if (cliConfig.ignoreUnexpectedWsMessages != null) {
    session.ignoreUnexpectedMessages = cliConfig.ignoreUnexpectedWsMessages;
  }

  const result = {
    autoStart: !session.server,
    debugSynchronization: 10000,

    ...session,
  };

  if (!result.server && !result.autoStart) {
    throw errorComposer.cannotSkipAutostartWithMissingServer();
  }

  return result;
}

module.exports = composeSessionConfig;
