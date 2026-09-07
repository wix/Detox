# Two Macs, one test run

Mac A (CI) runs a node and the relay; Mac B runs a node. Diffs are against a
Detox 20 project.

## 1. `.detoxrc.js`

```diff
 module.exports = {
+  client: process.env.CI ? { server: 'ws://127.0.0.1:8099' } : {},
   testRunner: {
```

`session` is refused anywhere in the file, selected or not:

```diff
     'ios.sim.release': {
       app: 'ios.release',
-      session: {
-        debugSynchronization: 3000,
-      },
     },
     'ios.manual': {
       behavior: {
         launchApp: 'manual'
-      },
-      session: {
-        autoStart: true,
-        server: 'ws://localhost:8099',
-        sessionId: 'com.wix.detox-example'
       }
     },
```

Leave the rest alone — `artifacts`, `behavior`, `testRunner.jest.*`,
`utilBinaryPaths`, Android. Inert, not fatal.

## 2. Both Macs: start a node

```sh
npx -y detox@21.0.0-alpha.1 server --host 0.0.0.0 --max-pool 4
```

Run it from `$HOME`, not inside a project. `--max-pool` = simulators at once;
2 on a 16 GB Mac mini. Port 8080.

## 3. Mac A: add the relay

```sh
cat > nodes.json <<'JSON'
[
  { "name": "mac-a", "url": "ws://<Mac A IP>:8080" },
  { "name": "mac-b", "url": "ws://<Mac B IP>:8080" }
]
JSON

npx -y detox@21.0.0-alpha.1 relay --host 0.0.0.0 --port 8099 --nodes nodes.json
```

No auth: anyone on the LAN can use it. `--token` in the full docs.

## 4. `jest.config.js`

4 + 4 = 8 slots, so 8 workers. Over that, the surplus fails instead of queueing:

```diff
-  'maxWorkers': process.env.CI ? maxWorkersMap[deviceType] || 1 : 1,
+  'maxWorkers': process.env.CI ? 8 : 1,
```

`detox/internals` is gone:

```diff
 const path = require('path');
-const { resolveConfig } = require('detox/internals');
-
-const maxWorkersMap = {
-  'android.emulator': 3,
-  'ios.simulator': 2,
-};
 
 module.exports = async () => {
-  const config = await resolveConfig();
+  const configurationName = process.env.DETOX_CONFIGURATION || '';
```

```diff
   const jestAllure2ReporterOptions = {
-    extends: require.resolve('detox-allure2-adapter/preset-allure'),
     overwrite: !process.env.CI,
```

`testEnvironment`, `globalSetup`, `globalTeardown`,
`reporters: ['detox/runners/jest/reporter']` — unchanged.

`testEnvironmentOptions.eventListeners` is not read in v21. Entries there are
dead but harmless; `jest-allure2-reporter` goes quiet with them.

## 5. Custom `testEnvironment.js`, if you have one

```diff
 const { DetoxCircusEnvironment } = require('detox/runners/jest');
-const { worker } = require('detox/internals')
 
 class CustomDetoxEnvironment extends DetoxCircusEnvironment {
-  async setup() {
-    await super.setup();
-
-    this.global.__waitUntilArtifactsManagerIsIdle__ = () => {
-      return worker._artifactsManager._idlePromise;
-    };
-  }
 }
```

## 6. Run it

```sh
CI=1 detox test
CI=1 detox logs            # every run
CI=1 detox logs <runId>    # one run, as text
```

`detox logs` shows which node a run landed on. From your laptop, no project
needed:

```sh
DETOX_CLIENT_SERVER=ws://<Mac A IP>:8099 detox logs
```

- `http://<Mac A IP>:8099/v1/runs`
- `http://<Mac A IP>:8099/v1/runs/<runId>/perfetto`
