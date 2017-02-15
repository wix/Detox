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

const noSession = {
  "ios-simulator": {
    "app": "ios/build/Build/Products/Release-iphonesimulator/example.app",
    "device": "iPhone 7 Plus"
  }
};

const noServer = {
  "session": {
    "sessionId": "test"
  },
  "ios-simulator": {
    "app": "ios/build/Build/Products/Release-iphonesimulator/example.app",
    "device": "iPhone 7 Plus"
  }
};

const noSessionId = {
  "session": {
    "server": "ws://localhost:8099",
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
  noSession,
  noServer,
  noSessionId,
  noScheme,
  noAppPath,
  noDevice
};
