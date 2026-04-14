# Detox Architecture

This document provides an overview of Detox's internal architecture for contributors and maintainers.

## Overview

Detox is a **gray-box end-to-end testing framework** for React Native mobile applications. Unlike black-box testing frameworks, Detox has visibility into the app's internal state, enabling automatic synchronization between tests and the app.

```text
┌───────────────────────────────────────────────────────────┐
│                Test Environment (Node.js)                 │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐  │
│  │ Test Runner │  │DetoxContext │  │ ArtifactsManager  │  │
│  │(Jest/Mocha) │  │  (Realms)   │  │                   │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────┬─────────┘  │
│         │                │                   │            │
│         └────────────────┼───────────────────┘            │
│                          │                                │
│                ┌─────────▼─────────┐                      │
│                │   DetoxWorker     │                      │
│                │   - device        │                      │
│                │   - element/by    │                      │
│                │   - expect        │                      │
│                └─────────┬─────────┘                      │
│                          │                                │
│                ┌─────────▼─────────┐                      │
│                │      Client       │                      │
│                │    (WebSocket)    │                      │
│                └─────────┬─────────┘                      │
└──────────────────────────┼────────────────────────────────┘
                           │
                 ┌─────────▼─────────┐
                 │   DetoxServer     │
                 │   (WebSocket)     │
                 │   localhost:port  │
                 └─────────┬─────────┘
                           │
┌──────────────────────────┼────────────────────────────────┐
│               Mobile Device/Simulator                     │
│                          │                                │
│                ┌─────────▼─────────┐                      │
│                │   Native Client   │                      │
│                │   (iOS/Android)   │                      │
│                │                   │                      │
│                │   - Synchronizer  │                      │
│                │   - Matchers      │                      │
│                │   - Actions       │                      │
│                └───────────────────┘                      │
└───────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Realms (`src/realms/`)

Detox uses a "realm" pattern to manage different execution contexts:

| Realm | Class | Purpose |
|-------|-------|---------|
| **Primary** | `DetoxPrimaryContext` | Full-featured context with device allocation, used in test runner process |
| **Secondary** | `DetoxSecondaryContext` | Lightweight config-snapshot context for worker processes |

**Key files:**

- `DetoxContext.js` - Base class exposing `device`, `element`, `expect`, `by`, `waitFor`, `web`, `system`
- `DetoxPrimaryContext.js` - Handles initialization, device allocation, server lifecycle
- `DetoxSecondaryContext.js` - Receives config snapshots, no device management

The base `DetoxContext` uses **funpermaproxy** to lazily delegate API calls to the worker:

```javascript
device = funpermaproxy(() => this[symbols.worker].device);
element = funpermaproxy.callable(() => this[symbols.worker].element);
```

### 2. Worker (`src/DetoxWorker.js`)

Each test worker creates a `DetoxWorker` instance that:

- Connects to the Detox server via `Client`
- Creates the `InvocationManager` for command serialization
- Instantiates the `RuntimeDevice` via environment factories
- Creates matchers (`by`, `element`, `expect`, `waitFor`)
- Manages the `ArtifactsManager`

**Lifecycle hooks:**

- `onRunDescribeStart` / `onRunDescribeFinish`
- `onTestStart` / `onTestDone`
- `onHookFailure` / `onTestFnFailure`

### 3. Client-Server Communication (`src/client/`, `src/server/`)

See [docs/architecture/client-server.md](docs/architecture/client-server.md) for details.

**Key components:**

- `Client` - WebSocket client connecting to server, sends actions to app
- `AsyncWebSocket` - Promise-based WebSocket wrapper
- `DetoxServer` - WebSocket server mediating tester ↔ app communication
- `DetoxSession` / `DetoxSessionManager` - Per-session state management

### 4. Device Management (`src/devices/`)

See [docs/architecture/devices.md](docs/architecture/devices.md) for details.

**Structure:**

```text
devices/
├── allocation/         # Device allocation strategies
│   ├── DeviceAllocator.js
│   ├── DeviceRegistry.js
│   └── drivers/
│       ├── ios/        # SimulatorAllocDriver
│       └── android/    # Emulator, Attached, Genycloud
├── runtime/            # Runtime device abstractions
│   ├── RuntimeDevice.js
│   └── drivers/
│       ├── ios/        # IosDriver, SimulatorDriver
│       └── android/    # EmulatorDriver, AttachedAndroidDriver, GenyCloudDriver
├── cookies/            # Device state serialization
└── validation/         # Environment validators
```

### 5. Artifacts (`src/artifacts/`)

See [docs/architecture/artifacts.md](docs/architecture/artifacts.md) for details.

**Plugins:**

- `screenshot` - Captures screenshots on failure or on-demand
- `video` - Records test execution video
- `log` - Aggregates device and app logs
- `instruments` - iOS performance profiling
- `uiHierarchy` - Dumps view hierarchy for debugging (iOS only)

### 6. Invocation System (`src/invoke.js`, `src/client/actions/`)

Commands are serialized as JSON and sent to the native app:

```javascript
// Test code
await element(by.id('button')).tap();

// Serialized to invocation
{
  type: 'invoke',
  params: {
    target: { type: 'Class', value: 'com.wix.detox.Detox' },
    method: 'perform',
    args: [{ /* matcher */ }, { /* action */ }]
  }
}
```

The `InvocationManager` handles serialization/deserialization and batching.

### 7. Matchers & Expectations (`src/ios/`, `src/android/`)

Platform-specific implementations:

| Component | iOS | Android |
|-----------|-----|---------|
| Matchers | `src/matchers/` | `src/android/matchers/` |
| Actions | `src/ios/` | `src/android/actions/` |
| Expectations | `src/ios/expectTwo.js` | `src/android/AndroidExpect.js` |

Note: Shared matcher factory logic is in `src/matchers/`. iOS-specific expectations and test runner code are in `src/ios/`.

### 8. Test Runner Integration (`runners/`)

```text
runners/
├── jest/
│   ├── testEnvironment/   # Jest environment setup
│   ├── reporters/         # Custom reporters
│   ├── globalSetup.js
│   └── globalTeardown.js
├── jest-circus/           # Circus event handling
└── mocha/                 # Mocha adapter
```

## Data Flow

### Test Execution Flow

```text
1. Jest runs test file
         │
         ▼
2. DetoxEnvironment.setup()
   └── detox.init()
         │
         ▼
3. DetoxPrimaryContext initializes
   ├── Starts DetoxServer
   ├── Allocates device
   └── Installs worker
         │
         ▼
4. DetoxWorker.init()
   ├── Connects Client to server
   ├── Creates RuntimeDevice
   ├── Creates matchers
   └── Installs app (if configured)
         │
         ▼
5. Test executes
   ├── element(by.id('x')).tap()
   │     └── Client.execute(invocation)
   │           └── Server relays to app
   │                 └── App executes action
   │                       └── App responds
   │                             └── Client resolves
   └── expect(element).toBeVisible()
         │
         ▼
6. DetoxEnvironment.teardown()
   └── detox.cleanup()
         │
         ▼
7. Artifacts collected, device deallocated
```

### Synchronization Flow

```text
Test sends action
       │
       ▼
Native client receives
       │
       ▼
Synchronizer checks app state:
├── Pending network requests?
├── Main thread busy?
├── Animations running?
├── React Native bridge busy?
└── JavaScript thread idle?
       │
       ▼
When idle: Execute action
       │
       ▼
Return result to test
```

## Key Design Patterns

### 1. Symbol-Based Privacy

Internal members use Symbols to prevent accidental access:

```javascript
const $worker = Symbol('worker');
class DetoxContext {
  [$worker] = null;
}
```

### 2. Factory Pattern

Environment-specific factories create platform-appropriate instances:

```javascript
const factories = environmentFactory.createFactories(deviceConfig);
// Returns: envValidatorFactory, artifactsManagerFactory,
//          matchersFactory, runtimeDeviceFactory
```

### 3. Cancellable Async Flow (CAF)

Long-running operations use CAF for cancellation:

```javascript
this._reinstallAppsOnDevice = CAF(this._reinstallAppsOnDevice.bind(this));
// Can be cancelled via: this._initToken.abort('CLEANUP')
```

### 4. Event-Driven Architecture

`ArtifactsManager` and `RuntimeDevice` use event emitters for loose coupling:

```javascript
deviceEmitter.on('bootDevice', this.onBootDevice.bind(this));
deviceEmitter.on('launchApp', this.onLaunchApp.bind(this));
```

## Configuration

Configuration flows through composition:

```text
.detoxrc.js / detox.config.js
           │
           ▼
loadExternalConfig()
           │
           ▼
CLI arguments (--configuration, --device-name, etc.)
           │
           ▼
composeDetoxConfig()
├── composeAppsConfig()
├── composeDeviceConfig()
├── composeArtifactsConfig()
├── composeBehaviorConfig()
└── composeSessionConfig()
           │
           ▼
RuntimeConfig
```

## Directory Structure

```text
detox/
├── src/
│   ├── realms/          # Context management
│   ├── client/          # WebSocket client
│   ├── server/          # WebSocket server
│   ├── devices/         # Device management
│   ├── artifacts/       # Artifact collection
│   ├── configuration/   # Config composition
│   ├── ios/             # iOS-specific code
│   ├── android/         # Android-specific code
│   ├── matchers/        # Matcher factories
│   ├── invoke.js        # Invocation manager
│   └── DetoxWorker.js   # Per-test worker
├── runners/             # Test runner integrations
├── local-cli/           # CLI commands
├── ios/                 # Native iOS SDK
└── android/             # Native Android SDK
```

## See Also

- [docs/architecture/client-server.md](docs/architecture/client-server.md) - Client-server protocol details
- [docs/architecture/devices.md](docs/architecture/devices.md) - Device management internals
- [docs/architecture/artifacts.md](docs/architecture/artifacts.md) - Artifact collection system
- [docs/articles/how-detox-works.md](docs/articles/how-detox-works.md) - User-facing explanation
- [docs/articles/design-principles.md](docs/articles/design-principles.md) - Design philosophy
