const getPort = require('get-port');

const isValidWebsocketURL = require('../utils/isValidWebsocketURL');
const uuid = require('../utils/uuid');

/**
 * @param {require('../errors/DetoxConfigErrorComposer')} errorComposer
 * @param {Detox.DetoxConfig} globalConfig
 * @param {Detox.DetoxConfigurationOverrides} localConfig
 */
async function composeSessionConfig({ errorComposer, cliConfig, globalConfig, localConfig }) {
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

  return {
    autoStart: !session.server,
    server: `ws://localhost:${await getPort()}`,
    sessionId: uuid.UUID(),
    debugSynchronization: 10000,

    ...session,
  };
}

module.exports = composeSessionConfig;
