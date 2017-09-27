const validOneDeviceNoSession = {
  "appName": "example",
  "binary": {
    "ios": "ios/build/Build/Products/"
  },
  "configurations": {
    "ios.sim.release": {
      "type": "ios.simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const validOneDeviceNoSessionNoBinary = {
  "appName": "example",
  "configurations": {
    "ios.sim.release": {
      "type": "ios.simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const validOneIosNoneDeviceNoSession = {
  "appName": "example",
  "configurations": {
    "ios.none": {
      "type": "ios.none",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const validTwoDevicesNoSession = {
  "appName": "example",
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
      "type": "ios.simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    },
    "ios.sim.debug": {
      "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/example.app",
      "type": "ios.simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const invalidDeviceNoBinary = {
  "appName": "example",
  "configurations": {
    "ios.sim.release": {
      "type": "ios.simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const invalidNoDevice = {
  "appName": "example",
  "configurations": {
  }
};

const invalidDeviceNoDeviceType = {
  "appName": "example",
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "here",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const invalidNoAppName = {
  "configurations": {
    "ios.sim.release": {
      "type": "ios.simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const invalidDeviceNoDeviceName = {
  "appName": "example",
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "here",
      "type": "ios.simulator"
    }
  }
};

const validOneDeviceAndSession = {
  "appName": "example",
  "session": {
    "server": "ws://localhost:8099",
    "sessionId": "test"
  },
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
      "type": "ios.simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const invalidSessionNoSessionId = {
  "appName": "example",
  "session": {
    "server": "ws://localhost:8099"
  }
};

const invalidSessionNoServer = {
  "appName": "example",
  "session": {
    "sessionId": "test"
  }
};

const invalidOneDeviceTypeEmulatorNoSession = {
  "appName": "example",
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "some.apk",
      "type": "emulator",
      "name": "an emulator"
    }
  }
};

const sessionPerConfiguration = {
  "appName": "example",
  "configurations": {
    "ios.sim.none": {
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
      "type": "ios.none",
      "name": "iPhone 7 Plus, iOS 10.2",
      "session": {
        "server": "ws://localhost:1111",
        "sessionId": "test_1111"
      }
    },
    "ios.sim.release": {
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
      "type": "ios.none",
      "name": "iPhone 7 Plus, iOS 10.2",
      "session": {
        "server": "ws://localhost:2222",
        "sessionId": "test_2222"
      }
    }
  }
};

const sessionInCommonAndInConfiguration = {
  "appName": "example",
  "session": {
    "server": "ws://localhost:1111",
    "sessionId": "test_1"
  },
  "configurations": {
    "ios.sim.none": {
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
      "type": "ios.none",
      "name": "iPhone 7 Plus, iOS 10.2",
      "session": {
        "server": "ws://localhost:2222",
        "sessionId": "test_2"
      }
    }
  }
};

const validOneEmulator = {
  "appName": "example",
  "configurations": {
    "android.emu.release": {
      "binaryPath": "android/app/build/outputs/apk/app-debug.apk",
      "type": "android.emulator",
      "name": "Nexus 5X"
    }
  }
};

module.exports = {
  validOneDeviceNoSession,
  validOneIosNoneDeviceNoSession,
  validTwoDevicesNoSession,
  invalidDeviceNoBinary,
  invalidNoDevice,
  invalidDeviceNoDeviceType,
  invalidDeviceNoDeviceName,
  validOneDeviceAndSession,
  invalidSessionNoSessionId,
  invalidSessionNoServer,
  invalidOneDeviceTypeEmulatorNoSession,
  invalidNoAppName,
  sessionPerConfiguration,
  sessionInCommonAndInConfiguration,
  validOneEmulator
};
