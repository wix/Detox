const CustomError = require('./errors/CustomError');
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

function throwOnEmptyName() {
  throw new DetoxConfigError(`'name' property is missing, should hold the device name to run on (e.g. "iPhone 7", "iPhone 7, iOS 10.2"`);
}

function throwOnEmptyType() {
  throw new DetoxConfigError(`'type' property is missing, should hold the device type to test on (currently only simulator is supported: ios.simulator or ios.none)`);
}

function throwOnEmptyBinaryPath() {
  throw new DetoxConfigError(`'binaryPath' property is missing, should hold the app binary path`);
}

class DetoxConfigError extends CustomError {

}

module.exports = {
  defaultSession,
  validateSession,
  throwOnEmptyName,
  throwOnEmptyType,
  throwOnEmptyBinaryPath
};
