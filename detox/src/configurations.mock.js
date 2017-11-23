const validOneDeviceNoSession = {
  "configurations": {
    "ios.sim.release": {
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
      "type": "ios.simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const validOneIosNoneDeviceNoSession = {
  "configurations": {
    "ios.none": {
      "type": "ios.none",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const validTwoDevicesNoSession = {
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
  "configurations": {
    "ios.sim.release": {
      "type": "ios.simulator",
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
      "type": "ios.simulator"
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
      "type": "ios.simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    }
  }
};

const pathsTests = {
  "session": {
    "server": "ws://localhost:8099",
    "sessionId": "test"
  },
  "configurations": {
    "absolutePath": {
      "binaryPath": "/tmp/abcdef/123",
      "type": "ios.simulator",
      "name": "iPhone 7 Plus, iOS 10.2"
    },
    "relativePath": {
      "binaryPath": "abcdef/123",
      "type": "ios.simulator",
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

const sessionPerConfiguration = {
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
  sessionPerConfiguration,
  sessionInCommonAndInConfiguration,
  validOneEmulator,
  pathsTests
};
