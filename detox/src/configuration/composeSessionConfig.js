const getPort = require('get-port');
const uuid = require('../utils/uuid');

/**
 *
 * @param {DetoxConfigErrorBuilder} errorBuilder
 * @param {*} detoxConfig
 * @param {*} deviceConfig
 */
async function composeSessionConfig({ errorBuilder, detoxConfig, deviceConfig }) {
  const session = deviceConfig.session || detoxConfig.session || {
    autoStart: true,
    server: `ws://localhost:${await getPort()}`,
    sessionId: uuid.UUID(),
  };

  if (!session.server) {
    throw errorBuilder.missingServerProperty();
  }

  if (!session.sessionId) {
    throw errorBuilder.missingSessionIdProperty();
  }

  return session;
}

module.exports = composeSessionConfig;
