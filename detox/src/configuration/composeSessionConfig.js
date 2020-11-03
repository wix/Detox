const getPort = require('get-port');
const uuid = require('../utils/uuid');
const isValidWebsocketURL = require('../utils/isValidWebsocketURL');

/**
 *
 * @param {DetoxConfigErrorBuilder} errorBuilder
 * @param {*} detoxConfig
 * @param {*} deviceConfig
 */
async function composeSessionConfig({ errorBuilder, cliConfig, detoxConfig, deviceConfig }) {
  const session = {
    ...detoxConfig.session,
    ...deviceConfig.session,
  };

  if (session.server != null) {
    const value = session.server;
    if (typeof value !== 'string' || !isValidWebsocketURL(value)) {
      throw errorBuilder.invalidServerProperty();
    }
  }

  if (session.sessionId != null) {
    const value = session.sessionId;
    if (typeof value !== 'string' || value.length === 0) {
      throw errorBuilder.invalidSessionIdProperty();
    }
  }

  if (session.debugSynchronization != null) {
    const value = session.debugSynchronization;
    if (typeof value !== 'number' || value < 0) {
      throw errorBuilder.invalidDebugSynchronizationProperty();
    }
  }

  if (cliConfig.debugSynchronization > 0) {
    session.debugSynchronization = +cliConfig.debugSynchronization;
  }

  return {
    autoStart: !session.server,
    server: `ws://localhost:${await getPort()}`,
    sessionId: uuid.UUID(),
    debugSynchronization: false,

    ...session,
  };
}

module.exports = composeSessionConfig;
