const DetoxConfigError = require('./errors/DetoxConfigError');
const uuid = require('./utils/uuid');
const getPort = require('get-port');

async function defaultSession() {
  return {
    server: `ws://localhost:${await getPort()}`,
    sessionId: uuid.UUID()
  };
}

function validateSession(session) {
  if (!session) {
    throw new Error(`No session configuration was found, pass settings under the session property`);
  }

  if (!session.server) {
    throw new Error(`session.server property is missing, should hold the server address`);
  }

  if (!session.sessionId) {
    throw new Error(`session.sessionId property is missing, should hold the server session id`);
  }
}

function throwOnEmptyDevice() {
  throw new DetoxConfigError(`'device' property is empty, should hold the device query to run on (e.g. { "type": "iPhone 11 Pro" }, { "avdName": "Nexus_5X_API_29" })`);
}

function throwOnEmptyType() {
  throw new DetoxConfigError(`'type' property is missing, should hold the device type to test on (e.g. "ios.simulator" or "android.emulator")`);
}

function throwOnEmptyBinaryPath() {
  throw new DetoxConfigError(`'binaryPath' property is missing, should hold the app binary path`);
}

module.exports = {
  defaultSession,
  validateSession,
  throwOnEmptyDevice,
  throwOnEmptyType,
  throwOnEmptyBinaryPath
};
