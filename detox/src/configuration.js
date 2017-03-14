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

function validateDevice(device) {
  if (!device) {
    throw new DetoxConfigError(`No scheme was found, in order to test a device pass settings under detox property, e.g.   
           "detox": {
            ...
            "ios-simulator": {
                "app": "ios/build/Build/Products/Release-iphonesimulator/example.app",
                "device": "iPhone 7 Plus"
            }
          }`);
  }

  if (!device.binaryPath) {
    throw new DetoxConfigError(`'binaryPath' property is missing, should hold the app binary path`);
  }
  if (!device.type) {
    throw new DetoxConfigError(`'type' property is missing, should hold the device type to test on (currently only simulator is supported)`);
  }
  if (!device.name) {
    throw new DetoxConfigError(`'name' property is missing, should hold the device name to run on (e.g. "iPhone 7", "iPhone 7, iOS 10.2"`);
  }
}

class DetoxConfigError extends CustomError {

}

module.exports = {
  defaultSession,
  validateSession,
  validateDevice
};
