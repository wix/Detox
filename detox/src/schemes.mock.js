const valid = {
  "session": {
    "server": "ws://localhost:8099",
    "sessionId": "test"
  },
  "ios-simulator": {
    "app": "ios/build/Build/Products/Release-iphonesimulator/example.app",
    "device": "iPhone 7 Plus"
  }
};

const noScheme = {
  "session": {
    "server": "ws://localhost:8099",
    "sessionId": "test"
  }
};

const noAppPath = {
  "session": {
    "server": "ws://localhost:8099",
    "sessionId": "test"
  },
  "ios-simulator": {
    "device": "iPhone 7 Plus"
  }
};

const noDevice = {
  "session": {
    "server": "ws://localhost:8099",
    "sessionId": "test"
  },
  "ios-simulator": {
    "app": "ios/build/Build/Products/Release-iphonesimulator/example.app"
  }
};
module.exports = {
  valid,
  noScheme,
  noAppPath,
  noDevice
};
