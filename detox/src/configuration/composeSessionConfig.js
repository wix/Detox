const getPort = require('get-port');
const uuid = require('../utils/uuid');

async function composeSessionConfig({ detoxConfig, deviceConfig }) {
  const session = deviceConfig.session || detoxConfig.session || {
    autoStart: true,
    server: `ws://localhost:${await getPort()}`,
    sessionId: uuid.UUID(),
  };

  if (!session.server) {
    throw new Error(`session.server property is missing, should hold the server address`);
  }

  if (!session.sessionId) {
    throw new Error(`session.sessionId property is missing, should hold the server session id`);
  }

  return session;
}

module.exports = composeSessionConfig;
