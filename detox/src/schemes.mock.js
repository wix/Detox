const validOneDeviceNoSession = {
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
      "type": "simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const validTwoDevicesNoSession = {
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
      "type": "simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    },
    "ios.sim.debug": {
      "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/example.app",
      "type": "simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const invalidDeviceNoBinary = {
  "configurations": {
    "ios.sim.release": {
      "type": "simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const invalidNoDevice = {
  "configurations": {
  }
};

const invalidDeviceNoDeviceType = {
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "here",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const invalidDeviceNoDeviceName = {
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "here",
      "type": "simulator"
    }
  }
};

const validOneDeviceAndSession = {
  "session": {
    "server": "ws://localhost:8099",
    "sessionId": "test"
  },
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
      "type": "simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const invalidSessionNoSessionId = {
  "session": {
    "server": "ws://localhost:8099"
  }
};

const invalidSessionNoServer = {
  "session": {
    "sessionId": "test"
  }
};

const invalidOneDeviceTypeEmulatorNoSession = {
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "some.apk",
      "type": "emulator",
      "name": "an emulator"
    }
  }
};

module.exports = {
  validOneDeviceNoSession,
  validTwoDevicesNoSession,
  invalidDeviceNoBinary,
  invalidNoDevice,
  invalidDeviceNoDeviceType,
  invalidDeviceNoDeviceName,
  validOneDeviceAndSession,
  invalidSessionNoSessionId,
  invalidSessionNoServer,
  invalidOneDeviceTypeEmulatorNoSession
};
