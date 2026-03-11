# Device Management

The device subsystem handles allocation, lifecycle, and interaction with iOS simulators, Android emulators, and cloud devices.

## Architecture Overview

```text
┌────────────────────────────────────────────────────────────┐
│                      Device Subsystem                      │
│                                                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐  │
│  │ DeviceAllocator │─►│  RuntimeDevice  │─►│   Driver   │  │
│  │                 │  │                 │  │            │  │
│  │ - allocate()    │  │ - launchApp()   │  │ - boot()   │  │
│  │ - free()        │  │ - terminateApp()│  │ - install()│  │
│  │                 │  │ - reloadRN()    │  │ - execute()│  │
│  └────────┬────────┘  └────────┬────────┘  └────────────┘  │
│           │                    │                           │
│  ┌────────▼────────┐  ┌────────▼────────┐                  │
│  │ DeviceRegistry  │  │  DeviceCookie   │                  │
│  │  (Lock files)   │  │ (Serialization) │                  │
│  └─────────────────┘  └─────────────────┘                  │
└────────────────────────────────────────────────────────────┘
```

## Directory Structure

```text
src/devices/
├── allocation/
│   ├── DeviceAllocator.js      # Main allocation coordinator
│   ├── DeviceList.js           # Available devices tracking
│   ├── DeviceRegistry.js       # Lock-based device registry
│   ├── drivers/
│   │   ├── ios/
│   │   │   └── SimulatorAllocDriver.js
│   │   └── android/
│   │       ├── emulator/
│   │       │   └── EmulatorAllocDriver.js
│   │       ├── attached/
│   │       │   └── AttachedAndroidAllocDriver.js
│   │       └── genycloud/
│   │           └── GenyAllocDriver.js
│   └── factories/
│       ├── ios.js
│       ├── android.js
│       └── external.js
├── runtime/
│   ├── RuntimeDevice.js        # Main device abstraction
│   └── drivers/
│       ├── DeviceDriverBase.js
│       ├── ios/
│       │   ├── IosDriver.js
│       │   └── SimulatorDriver.js
│       └── android/
│           ├── AndroidDriver.js
│           ├── emulator/
│           │   └── EmulatorDriver.js
│           ├── attached/
│           │   └── AttachedAndroidDriver.js
│           └── genycloud/
│               └── GenyCloudDriver.js
├── common/
│   └── drivers/
│       ├── ios/tools/
│       │   └── AppleSimUtils.js
│       └── android/
│           ├── exec/
│           │   ├── ADB.js
│           │   └── AAPT.js
│           └── tools/
│               ├── Instrumentation.js
│               └── AppInstallHelper.js
├── cookies/
│   └── index.js                # Device state serialization
└── validation/
    └── ...                     # Environment validators
```

## Device Types

| Type | Config Value | Platform | Description |
|------|--------------|----------|-------------|
| iOS Simulator | `ios.simulator` | iOS | Xcode simulators |
| Android Emulator | `android.emulator` | Android | AVD emulators |
| Android Attached | `android.attached` | Android | USB-connected devices |
| Genycloud | `android.genycloud` | Android | Genymotion cloud instances |

## Allocation System

### DeviceAllocator (`src/devices/allocation/DeviceAllocator.js`)

Coordinates device allocation with concurrency control. Think of `allocate` as reserving a table at a restaurant, while `postAllocate` is when the food is actually served — platform-specific setup that prepares the device for use:

```javascript
class DeviceAllocator {
  constructor(allocationDriver) {
    this._driver = allocationDriver;
  }

  async allocate(deviceConfig) {
    // Find or create a device matching the config
    // Return a device cookie
  }

  async postAllocate(cookie, configs) {
    // Delegates to the driver's postAllocate if it exists.
    // Each platform does different work here:
    //   iOS Simulator: boot with headless/bootArgs, clean app cache
    //   Android Emulator: wait for boot, get API level, disable animations, unlock screen
    //   Genycloud: connect ADB, wait for readiness, disable animations, set WiFi
    //   Attached Android: get API level, unlock screen
    // All Android drivers also optionally configure System UI (keyboard, nav, status bar)
    // Returns an enriched device cookie
  }

  async free(cookie, options) {
    // Release the device via the driver
  }
}
```

### DeviceRegistry (`src/devices/allocation/DeviceRegistry.js`)

Uses lock files for cross-process device ownership:

```javascript
class DeviceRegistry {
  constructor({ lockfilePath }) {
    this._lockfile = new ExclusiveLockfile(lockfilePath);
  }

  async allocateDevice(deviceQuery) {
    return this._lockfile.exclusively(async () => {
      // Find available device
      // Mark as allocated
      // Return device handle
    });
  }
}
```

### Allocation Drivers

Each device type has a specialized allocation driver:

**SimulatorAllocDriver** (`src/devices/allocation/drivers/ios/SimulatorAllocDriver.js`):

- Queries available simulators via `xcrun simctl`
- Creates simulators if needed
- Handles simulator lifecycle

**EmulatorAllocDriver** (`src/devices/allocation/drivers/android/emulator/EmulatorAllocDriver.js`):

- Validates AVD existence
- Launches emulators with appropriate flags
- Assigns unique ports

**GenyAllocDriver** (`src/devices/allocation/drivers/android/genycloud/GenyAllocDriver.js`):

- Communicates with Genymotion cloud API
- Provisions cloud instances
- Handles instance lifecycle

## Runtime Device

### RuntimeDevice (`src/devices/runtime/RuntimeDevice.js`)

The main device abstraction exposed to tests:

```javascript
class RuntimeDevice {
  constructor(deviceCookie, deps, configs) {
    this._driver = createDriver(deviceCookie, deps);
    this._appsConfig = configs.appsConfig;
  }

  // App management
  async launchApp(params) { /* ... */ }
  async terminateApp(bundleId) { /* ... */ }
  async installApp() { /* ... */ }
  async uninstallApp() { /* ... */ }

  // React Native specific
  async reloadReactNative() { /* ... */ }

  // Device control
  async sendToHome() { /* ... */ }
  async shake() { /* ... */ }
  async setLocation(lat, lon) { /* ... */ }
  async setURLBlacklist(urls) { /* ... */ }

  // State
  get id() { return this._driver.deviceId; }
  get name() { return this._driver.deviceName; }
}
```

### Driver Hierarchy

```text
DeviceDriverBase
├── IosDriver
│   └── SimulatorDriver
└── AndroidDriver
    ├── EmulatorDriver
    ├── AttachedAndroidDriver
    └── GenyCloudDriver
```

**DeviceDriverBase** (`src/devices/runtime/drivers/DeviceDriverBase.js`):

- Abstract base class
- Defines common interface
- Provides utility methods

**Platform Drivers**:

- Implement platform-specific operations
- Handle app installation/launch
- Manage device state

## Platform-Specific Tools

### iOS Tools

**AppleSimUtils** (`src/devices/common/drivers/ios/tools/AppleSimUtils.js`):

```javascript
class AppleSimUtils {
  async boot(deviceId) { /* xcrun simctl boot */ }
  async shutdown(deviceId) { /* xcrun simctl shutdown */ }
  async install(deviceId, path) { /* xcrun simctl install */ }
  async launch(deviceId, bundleId, args) { /* xcrun simctl launch */ }
  async setPermissions(deviceId, bundleId, permissions) { /* ... */ }
}
```

### Android Tools

**ADB** (`src/devices/common/drivers/android/exec/ADB.js`):

```javascript
class ADB {
  async devices() { /* adb devices */ }
  async install(deviceId, apkPath) { /* adb install */ }
  async shell(deviceId, command) { /* adb shell */ }
  async forward(deviceId, local, remote) { /* adb forward */ }
}
```

**Instrumentation** (`src/devices/common/drivers/android/tools/Instrumentation.js`):

```javascript
class Instrumentation {
  async launch(deviceId, bundleId, testRunner, args) {
    // am instrument -w -r ...
  }
}
```

## Device Lifecycle

### Allocation Flow

```text
1. Test starts
   │
   ▼
2. DeviceAllocator.allocate(deviceConfig)
   │
   ├── Query available devices
   │   └── SimulatorQuery / FreeDeviceFinder
   │
   ├── Acquire lock
   │   └── DeviceRegistry.allocateDevice()
   │
   └── Return DeviceCookie

3. DeviceAllocator.postAllocate(cookie, configs)
   │
   ├── Platform-specific device setup
   │   ├── iOS: Boot simulator, clean app cache
   │   └── Android: Wait for boot, disable animations,
   │       unlock screen, configure System UI
   │
   └── Return enriched DeviceCookie

4. RuntimeDevice created with cookie
   │
   ▼
5. Tests execute
   │
   ▼
6. DeviceAllocator.free(cookie)
   │
   ├── Shutdown (if configured)
   │
   └── Release lock
```

### App Launch Flow

```text
1. device.launchApp(params)
   │
   ├── Terminate if running
   │
   ├── Build launch args
   │   ├── Detox server URL
   │   ├── Session ID
   │   └── User-provided args
   │
   ├── Platform-specific launch
   │   ├── iOS: xcrun simctl launch
   │   └── Android: am instrument
   │
   └── Wait for app connection
       └── client.waitUntilReady()
```

## Device Cookie

Device cookies serialize device state for passing between processes:

```javascript
// src/devices/cookies/index.js
const DeviceCookie = {
  serialize(device) {
    return {
      id: device.id,
      type: device.type,
      // Platform-specific data
    };
  },

  deserialize(cookie) {
    // Reconstruct device handle
  }
};
```

## Environment Validation

Validators ensure the environment is properly configured:

```javascript
// iOS validator
class IosSimulatorEnvValidator {
  async validate() {
    // Check Xcode installation
    // Verify xcrun availability
    // Validate simulator runtime
  }
}

// Android validator
class AndroidEmulatorEnvValidator {
  async validate() {
    // Check ANDROID_HOME
    // Verify ADB installation
    // Validate emulator availability
  }
}
```

## Event Emission

RuntimeDevice emits lifecycle events for artifact collection:

```javascript
class RuntimeDevice {
  async launchApp(params) {
    await this._eventEmitter.emit('beforeLaunchApp', launchInfo);

    // ... launch logic ...

    await this._eventEmitter.emit('launchApp', launchInfo);
    await this._eventEmitter.emit('appReady', appInfo);
  }

  async uninstallApp() {
    await this._eventEmitter.emit('beforeUninstallApp', appInfo);
    // ... uninstall logic ...
  }

  async terminateApp() {
    await this._eventEmitter.emit('beforeTerminateApp', appInfo);
    // ... terminate logic ...
    await this._eventEmitter.emit('terminateApp', appInfo);
  }
}
```

## Configuration

Device configuration in `.detoxrc.js`:

```javascript
module.exports = {
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15 Pro',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_4_API_30',
      },
    },
    genycloud: {
      type: 'android.genycloud',
      device: {
        recipeUUID: '...',
      },
    },
  },
};
```

## See Also

- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Main architecture overview
- [docs/config/devices.mdx](../config/devices.mdx) - Device configuration reference
- [docs/guide/android-dev-env.md](../guide/android-dev-env.md) - Android setup guide
