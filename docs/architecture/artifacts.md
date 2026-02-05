# Artifacts System

The artifacts subsystem collects test artifacts like screenshots, videos, logs, and performance data during test execution.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Artifacts Subsystem                     │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   ArtifactsManager                    │  │
│  │                                                       │  │
│  │  - Registers plugins                                  │  │
│  │  - Subscribes to device events                        │  │
│  │  - Orchestrates lifecycle callbacks                   │  │
│  │  - Manages idle callback queue                        │  │
│  └────────────────────────┬──────────────────────────────┘  │
│                           │                                 │
│           ┌───────────────┼───────────────┐                 │
│           │               │               │                 │
│     ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐           │
│     │Screenshot │   │   Video   │   │    Log    │           │
│     │  Plugin   │   │  Plugin   │   │  Plugin   │           │
│     └───────────┘   └───────────┘   └───────────┘           │
│                                                             │
│     ┌───────────┐   ┌───────────┐                           │
│     │Instruments│   │UIHierarchy│                           │
│     │  Plugin   │   │  (iOS)    │                           │
│     └───────────┘   └───────────┘                           │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  ArtifactPathBuilder                  │  │
│  │  Generates paths: artifacts/{config}/{test}/artifact  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/artifacts/
├── ArtifactsManager.js           # Main orchestrator
├── providers/
│   └── index.js                  # Exports: AndroidArtifactPluginsProvider,
│                                 #          IosArtifactPluginsProvider,
│                                 #          IosSimulatorArtifactPluginsProvider
├── templates/
│   ├── artifact/
│   │   ├── Artifact.js           # Base artifact class
│   │   └── FileArtifact.js       # File-based artifact
│   └── plugin/
│       ├── ArtifactPlugin.js     # Base plugin class
│       ├── StartupAndTestRecorderPlugin.js
│       ├── TwoSnapshotsPerTestPlugin.js
│       └── WholeTestRecorderPlugin.js
├── screenshot/
│   ├── ScreenshotArtifactPlugin.js
│   ├── SimulatorScreenshotPlugin.js    # iOS
│   └── ADBScreencapPlugin.js           # Android
├── video/
│   ├── VideoArtifactPlugin.js
│   ├── SimulatorRecordVideoPlugin.js   # iOS
│   └── ADBScreenrecorderPlugin.js      # Android
├── log/
│   ├── LogArtifactPlugin.js
│   ├── ios/
│   │   └── SimulatorLogPlugin.js
│   └── android/
│       └── ADBLogcatPlugin.js
├── instruments/
│   ├── InstrumentsArtifactPlugin.js
│   ├── ios/
│   │   └── SimulatorInstrumentsPlugin.js
│   └── android/
│       └── AndroidInstrumentsPlugin.js
├── uiHierarchy/
│   └── IosUIHierarchyPlugin.js         # iOS only
└── utils/
    ├── ArtifactPathBuilder.js
    └── temporaryPath.js
```

## ArtifactsManager

### Initialization

```javascript
class ArtifactsManager extends EventEmitter {
  constructor({ rootDir, pathBuilder, plugins }) {
    this._pluginConfigs = plugins;
    this._artifactPlugins = {};
    this._pathBuilder = new ArtifactPathBuilder({ rootDir });
    this._idlePromise = Promise.resolve();
  }

  registerArtifactPlugins(artifactPluginFactoriesMap) {
    for (const [key, factory] of Object.entries(artifactPluginFactoriesMap)) {
      const config = this._pluginConfigs[key];
      this._artifactPlugins[key] = this._instantiateArtifactPlugin(factory, config);
    }
  }
}
```

### Plugin Instantiation

Each plugin receives an API object for interacting with the manager:

```javascript
_instantiateArtifactPlugin(pluginFactory, pluginUserConfig) {
  const artifactsApi = {
    plugin: null,
    userConfig: { ...pluginUserConfig },

    preparePathForArtifact: async (artifactName, testSummary) => {
      const artifactPath = this._pathBuilder.buildPathForTestArtifact(artifactName, testSummary);
      const artifactDir = path.dirname(artifactPath);
      await fs.ensureDir(artifactDir);
      return artifactPath;
    },

    trackArtifact: (artifact) => this.emit('trackArtifact', artifact),
    untrackArtifact: (artifact) => this.emit('untrackArtifact', artifact),

    requestIdleCallback: (callback) => {
      // Queue for execution during idle time
      this._idleCallbackRequests.push({ caller: artifactsApi.plugin, callback });
      return this._idlePromise;
    },
  };

  const plugin = pluginFactory(artifactsApi);
  artifactsApi.plugin = plugin;
  return plugin;
}
```

### Device Event Subscription

```javascript
subscribeToDeviceEvents(deviceEmitter) {
  deviceEmitter.on('bootDevice', this.onBootDevice.bind(this));
  deviceEmitter.on('beforeShutdownDevice', this.onBeforeShutdownDevice.bind(this));
  deviceEmitter.on('shutdownDevice', this.onShutdownDevice.bind(this));
  deviceEmitter.on('beforeLaunchApp', this.onBeforeLaunchApp.bind(this));
  deviceEmitter.on('launchApp', this.onLaunchApp.bind(this));
  deviceEmitter.on('appReady', this.onAppReady.bind(this));
  deviceEmitter.on('beforeUninstallApp', this.onBeforeUninstallApp.bind(this));
  deviceEmitter.on('beforeTerminateApp', this.onBeforeTerminateApp.bind(this));
  deviceEmitter.on('terminateApp', this.onTerminateApp.bind(this));
  deviceEmitter.on('createExternalArtifact', this.onCreateExternalArtifact.bind(this));
}
```

### Lifecycle Events

```javascript
// Test lifecycle
async onRunDescribeStart(suite) {
  await this._callPlugins('ascending', 'onRunDescribeStart', suite);
}

async onTestStart(testSummary) {
  await this._callPlugins('ascending', 'onTestStart', testSummary);
}

async onTestDone(testSummary) {
  await this._callPlugins('descending', 'onTestDone', testSummary);
}

async onRunDescribeFinish(suite) {
  await this._callPlugins('descending', 'onRunDescribeFinish', suite);
}

// Failure hooks
async onHookFailure(testSummary) {
  await this._callPlugins('plain', 'onHookFailure', testSummary);
}

async onTestFnFailure(testSummary) {
  await this._callPlugins('plain', 'onTestFnFailure', testSummary);
}
```

### Plugin Execution Strategy

Plugins can be called in different orders based on priority:

```javascript
async _callPlugins(strategy, methodName, ...args) {
  for (const pluginGroup of this._groupPlugins(strategy)) {
    await Promise.all(pluginGroup.map(async (plugin) => {
      try {
        await plugin[methodName](...args);
      } catch (e) {
        this._unhandledPluginExceptionHandler(e, { plugin, methodName });
      }
    }));
  }
}

_groupPlugins(strategy) {
  if (strategy === 'plain') {
    return [_.values(this._artifactPlugins)];
  }

  const byPriority = _.chain(this._artifactPlugins)
    .values()
    .groupBy('priority')
    .entries()
    .sortBy(([priority]) => Number(priority))
    .map(1)
    .value();

  return strategy === 'descending' ? byPriority.reverse() : byPriority;
}
```

## Plugin Types

### Base Plugin (`src/artifacts/templates/plugin/ArtifactPlugin.js`)

```javascript
class ArtifactPlugin {
  constructor({ api }) {
    this.api = api;
    this.enabled = api.userConfig.enabled !== false;
    this.keepOnlyFailedTestsArtifacts = api.userConfig.keepOnlyFailedTestsArtifacts;
  }

  // Lifecycle hooks (override in subclasses)
  async onBootDevice(deviceInfo) {}
  async onBeforeLaunchApp(appLaunchInfo) {}
  async onLaunchApp(appLaunchInfo) {}
  async onTestStart(testSummary) {}
  async onTestDone(testSummary) {}
  async onBeforeCleanup() {}
}
```

### Screenshot Plugin

Captures screenshots on test failure or on-demand:

```javascript
class ScreenshotArtifactPlugin extends TwoSnapshotsPerTestPlugin {
  async preparePathForSnapshot(testSummary, name) {
    return this.api.preparePathForArtifact(`${name}.png`, testSummary);
  }

  async takeSnapshot(name) {
    // Delegate to device driver
    return this.driver.takeScreenshot(name);
  }
}
```

Configuration:
```javascript
{
  artifacts: {
    plugins: {
      screenshot: {
        enabled: true,
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: true,
      }
    }
  }
}
```

### Video Plugin

Records test execution:

```javascript
class VideoArtifactPlugin extends WholeTestRecorderPlugin {
  async onTestStart(testSummary) {
    await this.startRecording();
  }

  async onTestDone(testSummary) {
    await this.stopRecording();

    if (testSummary.status === 'passed' && this.keepOnlyFailedTestsArtifacts) {
      await this.discardRecording();
    } else {
      await this.saveRecording(testSummary);
    }
  }
}
```

### Log Plugin

Aggregates device and app logs:

```javascript
class LogArtifactPlugin extends StartupAndTestRecorderPlugin {
  async onLaunchApp(appLaunchInfo) {
    await this.startCapturingLogs(appLaunchInfo);
  }

  async onTestDone(testSummary) {
    const logs = await this.stopCapturingLogs();
    await this.saveLogs(logs, testSummary);
  }
}
```

### Instruments Plugin (iOS)

Records performance profiles:

```javascript
class InstrumentsArtifactPlugin extends ArtifactPlugin {
  async startRecording({ recordingPath, samplingInterval }) {
    await this.client.startInstrumentsRecording({ recordingPath, samplingInterval });
  }

  async stopRecording() {
    await this.client.stopInstrumentsRecording();
  }
}
```

### UI Hierarchy Plugin (iOS)

Captures view hierarchy for debugging (iOS only via `IosUIHierarchyPlugin`):

```javascript
class IosUIHierarchyPlugin extends ArtifactPlugin {
  async onTestFnFailure(testSummary) {
    const hierarchy = await this.client.captureViewHierarchy();
    await this.saveHierarchy(hierarchy, testSummary);
  }
}
```

## Platform-Specific Implementations

Each artifact type has platform-specific implementations:

| Artifact | iOS (Simulator) | Android |
|----------|-----------------|---------|
| Screenshot | `SimulatorScreenshotPlugin` | `ADBScreencapPlugin` |
| Video | `SimulatorRecordVideoPlugin` | `ADBScreenrecorderPlugin` |
| Log | `SimulatorLogPlugin` | `ADBLogcatPlugin` |
| Instruments | `SimulatorInstrumentsPlugin` | `AndroidInstrumentsPlugin` |
| UI Hierarchy | `IosUIHierarchyPlugin` | Not available |

The appropriate plugin is selected by the provider based on the device type:
- `IosSimulatorArtifactPluginsProvider` for iOS simulators
- `AndroidArtifactPluginsProvider` for Android devices

## Artifact Templates

### Two Snapshots Per Test

Takes snapshots at test start and end:

```javascript
class TwoSnapshotsPerTestPlugin extends ArtifactPlugin {
  async onTestStart(testSummary) {
    if (this.shouldTakeAutomaticSnapshots) {
      await this.takeSnapshot('testStart');
    }
  }

  async onTestDone(testSummary) {
    if (this.shouldTakeAutomaticSnapshots) {
      await this.takeSnapshot('testDone');
    }
  }
}
```

### Whole Test Recorder

Records throughout entire test:

```javascript
class WholeTestRecorderPlugin extends ArtifactPlugin {
  async onTestStart(testSummary) {
    await this.startRecording(testSummary);
  }

  async onTestDone(testSummary) {
    await this.stopRecording();
    await this.saveOrDiscard(testSummary);
  }
}
```

## Path Building

### ArtifactPathBuilder

Generates consistent artifact paths:

```javascript
class ArtifactPathBuilder {
  constructor({ rootDir }) {
    this._rootDir = rootDir;
  }

  buildPathForTestArtifact(artifactName, testSummary) {
    // Path format: rootDir/{statusSign}{fullName}({invocations})/{artifactName}
    // Example: artifacts/✓ Login should work/screenshot.png
    // Example: artifacts/✗ Login should work (2)/screenshot.png  (on retry)
    const testDir = this._constructDirectoryNameForCurrentRunningTest(testSummary);
    return path.join(this._rootDir, testDir, artifactName);
  }

  _constructDirectoryNameForCurrentRunningTest(testSummary) {
    const prefix = this._buildTestDirectoryPrefix(testSummary);
    const suffix = testSummary.invocations > 1 ? ` (${testSummary.invocations})` : '';
    return constructSafeFilename(prefix, testSummary.fullName, suffix);
  }

  _buildTestDirectoryPrefix(testSummary) {
    return testSummary.status === 'passed' ? '✓ ' : '✗ ';
  }
}
```

Custom path builders can be provided:

```javascript
// detox.config.js
module.exports = {
  artifacts: {
    rootDir: 'e2e-artifacts',
    pathBuilder: './my-path-builder.js',
  }
};
```

## Configuration

```javascript
module.exports = {
  artifacts: {
    rootDir: 'artifacts',
    pathBuilder: undefined, // or custom path builder
    plugins: {
      screenshot: {
        enabled: true,
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: true,
      },
      video: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: true,
      },
      log: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: false,
      },
      instruments: {
        enabled: false,
      },
      uiHierarchy: {  // iOS only
        enabled: true,
        keepOnlyFailedTestsArtifacts: true,
      },
    },
  },
};
```

## Lifecycle Flow

```
Test Suite Starts
        │
        ▼
onRunDescribeStart(suite)
        │
        ▼
┌────────────────────────────────┐
│       For each test:           │
│                                │
│  onTestStart(testSummary)      │
│          │                     │
│          ▼                     │
│  [Test executes]               │
│          │                     │
│     ┌────┴────┐                │
│     │ Failure │                │
│     └────┬────┘                │
│          │                     │
│  onHookFailure() or            │
│  onTestFnFailure()             │
│          │                     │
│          ▼                     │
│  onTestDone(testSummary)       │
│          │                     │
│  [Save or discard artifacts]   │
│                                │
└────────────────────────────────┘
        │
        ▼
onRunDescribeFinish(suite)
        │
        ▼
onBeforeCleanup()
        │
        ▼
[Final artifact processing]
```

## Idle Callbacks

Plugins can defer non-critical work:

```javascript
// In plugin
async onTestDone(testSummary) {
  // Critical work first
  await this.stopRecording();

  // Defer compression to idle time
  this.api.requestIdleCallback(async () => {
    await this.compressVideo();
    await this.uploadToCloud();
  });
}
```

## External Artifacts

Plugins can create artifacts from external sources:

```javascript
// During test
device.createExternalArtifact({
  pluginId: 'screenshot',
  artifactName: 'custom-screenshot',
  artifactPath: '/tmp/screenshot.png',
});

// In ArtifactsManager
async onCreateExternalArtifact({ pluginId, artifactName, artifactPath }) {
  await this._callSinglePlugin(pluginId, 'onCreateExternalArtifact', {
    artifact: new FileArtifact({ temporaryPath: artifactPath }),
    name: artifactName,
  });
}
```

## See Also

- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Main architecture overview
- [docs/config/artifacts.mdx](../config/artifacts.mdx) - Artifacts configuration
- [docs/guide/taking-screenshots.md](../guide/taking-screenshots.md) - Screenshot guide
