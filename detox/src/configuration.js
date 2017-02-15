const CustomError = require('./errors/errors').CustomError;

const defaultConfig = {
  session: {
    server: 'ws://localhost:8099',
    sessionId: 'example'
  }
};

function validateConfig(detoxConfig) {
  if (!detoxConfig.session) {
    throw new Error(`No session configuration was found, pass settings under the session property`);
  }

  const settings = detoxConfig.session;

  if (!settings.server) {
    throw new Error(`session.server property is missing, should hold the server address`);
  }

  if (!settings.sessionId) {
    throw new Error(`session.sessionId property is missing, should hold the server session id`);
  }
}

function validateScheme(scheme) {
  if (!scheme) {
    throw new DetoxConfigError(`No scheme was found, in order to test a device pass settings under detox property, e.g.   
           "detox": {
            ...
            "ios-simulator": {
                "app": "ios/build/Build/Products/Release-iphonesimulator/example.app",
                "device": "iPhone 7 Plus"
            }
          }`);
  }

  if (!scheme.device) {
    throw new DetoxConfigError(`scheme.device property is missing, should hold the device type to test on`);
  }
  if (!scheme.app) {
    throw new DetoxConfigError(`scheme.app property is missing, should hold the app binary path`);
  }
}

class DetoxConfigError extends CustomError {

}

module.exports = {
  defaultConfig,
  validateConfig,
  validateScheme
};
