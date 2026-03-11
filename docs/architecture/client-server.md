# Client-Server Communication

Detox uses a WebSocket-based client-server architecture for communication between the test process (Node.js) and the mobile app.

## Architecture Overview

```text
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│   Test Process   │        │   DetoxServer    │        │    Mobile App    │
│    (Node.js)     │        │   (localhost)    │        │   (iOS/Android)  │
│                  │        │                  │        │                  │
│  ┌────────────┐  │   WS   │  ┌────────────┐  │   WS   │  ┌────────────┐  │
│  │   Client   │◄─┼───────►│  │  Session   │◄─┼───────►│  │   Native   │  │
│  │            │  │        │  │  Manager   │  │        │  │   Client   │  │
│  └────────────┘  │        │  └────────────┘  │        │  └────────────┘  │
└──────────────────┘        └──────────────────┘        └──────────────────┘
```

## Why a Mediator Server?

The server acts as a mediator rather than having direct client-to-app communication:

1. **Resilience** - Either side can disconnect (app restart, simulator boot) without losing the other's state
2. **Session management** - Multiple test workers can share device sessions
3. **Debugging** - Server can log all messages for troubleshooting
4. **Flexibility** - Server can run on a different machine for CI/CD

## Components

### Client (`src/client/Client.js`)

The test-side WebSocket client that:

- Connects to the Detox server
- Sends actions to the mobile app
- Handles responses and events
- Manages synchronization state

**Key methods:**

```javascript
// Connect to server and login to session
await client.connect();

// Send an invocation (tap, type, scroll, etc.)
await client.execute(invocation);

// Wait for app to be ready (synchronized)
await client.waitUntilReady();

// Send action and wait for response
await client.sendAction(new actions.Invoke(invocation));
```

**Event handling:**

```javascript
client.setEventCallback('appConnected', this._onAppConnected);
client.setEventCallback('ready', this._onAppReady);
client.setEventCallback('AppNonresponsiveDetected', this._onAppUnresponsive);
client.setEventCallback('AppWillTerminateWithError', this._onBeforeAppCrash);
client.setEventCallback('appDisconnected', this._onAppDisconnected);
client.setEventCallback('serverError', this._onUnhandledServerError);
```

### AsyncWebSocket (`src/client/AsyncWebSocket.js`)

Promise-based wrapper around the WebSocket API:

```javascript
class AsyncWebSocket {
  async open() { /* ... */ }
  async close() { /* ... */ }
  async send(action, options) { /* ... */ }

  // Track in-flight requests for timeout handling
  inFlightPromises = {};
}
```

### DetoxServer (`src/server/DetoxServer.js`)

WebSocket server that mediates all communication:

```javascript
class DetoxServer {
  constructor({ port, standalone }) {
    this._sessionManager = new DetoxSessionManager();
    this._wss = new WebSocket.Server({ port });
  }

  async open() {
    // Start listening
  }

  _onConnection(ws, req) {
    this._sessionManager.registerConnection(ws, req.socket);
  }
}
```

### DetoxSession (`src/server/DetoxSession.js`)

Per-session state management:

```javascript
class DetoxSession {
  constructor(id) {
    this.id = id;
    this.tester = null;  // Test process connection
    this.app = null;     // Mobile app connection
  }

  // Route messages between tester and app
  // Handle connection/disconnection events
}
```

### DetoxSessionManager (`src/server/DetoxSessionManager.js`)

Manages multiple concurrent sessions:

```javascript
class DetoxSessionManager {
  constructor() {
    this._sessions = new Map();
  }

  registerConnection(ws, socket) {
    // Identify session from login message
    // Create or join existing session
  }

  getSession(sessionId) {
    return this._sessions.get(sessionId);
  }
}
```

## Message Protocol

All messages are JSON objects wrapped in a standard envelope with `type` and `messageId`. However, the **invocation payload** inside `params` differs significantly between platforms.

### Platform Differences

iOS and Android implement the invocation protocol quite differently:

**Android — reflection-centric:** The `generation/` project parses Java source files (Espresso, UiAutomator, Detox helpers) and auto-generates JS adapter classes in `src/android/espressoapi/`. Each adapter method returns an invocation object describing a Java class, method name, and typed arguments. The native side uses reflection (`MethodInvocation`) to dispatch the call. To add new actions, you add a Java method and run `npm run build` in `generation/`.

**iOS — handcrafted protocol:** Each action and expectation is explicitly implemented in Swift (see `detox/ios/Detox/Invocation/`). The native `InvocationManager` routes by `type` (`action`, `expectation`, `webAction`, `webExpectation`), and each action type (e.g., `TapAction`, `LongPressAction`) has its own `perform(on:)` method. There is no reflection — the mapping from action names to classes is a static registry in `Action.swift`.

### Android Invocation Format

Android invocations describe a Java class + method to call via reflection:

```json
{
  "type": "invoke",
  "messageId": 1,
  "params": {
    "target": {
      "type": "Class",
      "value": "com.wix.detox.espresso.DetoxAction"
    },
    "method": "multiClick",
    "args": [
      { "type": "Integer", "value": 2 }
    ]
  }
}
```

### iOS Invocation Format

iOS invocations use a structured format with explicit action/expectation types and Earl Grey predicates — no reflection involved:

```json
{
  "type": "invoke",
  "messageId": 1,
  "params": {
    "type": "action",
    "action": "tap",
    "params": [],
    "predicate": {
      "type": "id",
      "value": "myButton"
    }
  }
}
```

### Response (App → Test)

```json
{
  "type": "invokeResult",
  "messageId": 1,
  "params": {
    "result": "success"
  }
}
```

### Event (App → Test)

Certain messages use fixed negative `messageId` values instead of the auto-incrementing positive IDs used for request-response pairs. These are messages that don't participate in normal request-response pairing:

| messageId | Message | Direction |
|-----------|---------|-----------|
| `-1` | `testerDisconnected` | Server → App |
| `-1000` | `ready` / `reactNativeReload` | App → Test / Test → App |
| `-10000` | `AppWillTerminateWithError` | App → Test (crash) |
| `-0xc1ea` | `cleanup` | Test → App |

```json
{
  "type": "ready",
  "messageId": -1000
}
```

```json
{
  "type": "AppWillTerminateWithError",
  "messageId": -10000,
  "params": {
    "errorDetails": "..."
  }
}
```

## Actions (`src/client/actions/actions.js`)

Predefined action classes for common operations:

| Action | Purpose |
|--------|---------|
| `Login` | Authenticate with session ID |
| `Ready` | Query if app is ready |
| `Invoke` | Execute a command on the app |
| `Cleanup` | Signal test completion |
| `ReloadReactNative` | Reload the RN bundle |
| `CurrentStatus` | Get app synchronization status |
| `Shake` | Trigger device shake |
| `SetOrientation` | Change device orientation |
| `SetSyncSettings` | Configure synchronization settings |
| `DeliverPayload` | Send push notification, deep link |
| `CaptureViewHierarchy` | Dump UI hierarchy |
| `GenerateViewHierarchyXml` | Generate UI hierarchy as XML (iOS: direct WS action, Android: via invoke) |
| `SetInstrumentsRecordingState` | Control iOS performance profiling |
| `WaitForBackground` | Wait for app to background |
| `WaitForActive` | Wait for app to foreground |

## Connection Lifecycle

```text
1. Test starts
   │
   ├── Client.connect()
   │     └── WebSocket connects to server
   │
   ├── Client.sendAction(Login)
   │     └── Server creates/joins session
   │
   └── Server waits for app connection

2. App launches (with server URL in launch args)
   │
   ├── Native client connects to server
   │     └── Server associates with session
   │
   └── Server notifies test: 'appConnected'

3. App becomes ready
   │
   └── Native client sends 'ready' event

4. Test executes
   │
   ├── Client.execute(invocation)
   │     ├── Server routes to app
   │     ├── App executes
   │     └── App responds via server
   │
   └── Client receives result

5. Test completes
   │
   ├── Client.cleanup()
   │     └── Sends Cleanup action
   │
   └── Client.close()
```

## Synchronization

The client monitors app readiness through deferred promises (simplified):

```javascript
// Track connection state
this._whenAppIsConnected = new Deferred();
this._whenAppIsReady = new Deferred();

// Wait for synchronization (simplified - actual implementation has additional checks)
async waitUntilReady() {
  await this._whenAppIsConnected.promise;
  await this.sendAction(new actions.Ready());
  this._whenAppIsReady.resolve();
}
```

## Slow Invocation Detection

When `debugSynchronization` is enabled, the client periodically queries app status during long operations:

```javascript
_scheduleSlowInvocationQuery() {
  this._slowInvocationStatusHandle = setTimeout(async () => {
    const status = await this.currentStatus();
    log.info({ event: 'APP_STATUS' }, status);
    // Reschedule if still waiting
  }, this._slowInvocationTimeout);
}
```

## Error Handling

### App Crash Detection

```javascript
_onBeforeAppCrash({ params }) {
  this._pendingAppCrash = new DetoxRuntimeError({
    message: 'The app has crashed',
    debugInfo: params.errorDetails,
  });

  // Reject pending promises
  // Schedule app termination
}
```

### Disconnect Handling

```javascript
_onAppDisconnected() {
  if (this._pendingAppCrash) {
    this._whenAppDisconnected.reject(this._pendingAppCrash);
    this._asyncWebSocket.rejectAll(this._pendingAppCrash);
  }
}
```

## User Stack Traces

The client preserves user test stack traces for better error messages:

```javascript
async _doSendAction(action, options) {
  const errorWithUserStack = createErrorWithUserStack();

  try {
    const response = await this._asyncWebSocket.send(action, options);
    return await action.handle(response);
  } catch (err) {
    throw replaceErrorStack(errorWithUserStack, asError(err));
  }
}
```

## See Also

- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Main architecture overview
- [docs/architecture/devices.md](devices.md) - Device management
- [docs/config/session.mdx](../config/session.mdx) - Session configuration
