# detox-driver-harmony

HarmonyOS (OpenHarmony) driver for [Detox](https://github.com/wix/Detox) — test RNOH (React Native on HarmonyOS) apps with the same Detox API as iOS and Android.

## What this does

Enables Detox to drive HarmonyOS apps via `@kit.TestKit` (HarmonyOS built-in UI testing API). Test code is 100% identical across platforms:

```js
await element(by.id('login-btn')).tap();
await expect(element(by.text('Welcome'))).toBeVisible();
```

## Architecture

```
Jest (Node.js) ──WS──> DetoxServer ──WS──> DetoxMain (ArkTS, in-app)
                                                │
                                                ├── MethodInvocation (parses Espresso invoke tree)
                                                ├── UiDriver (@kit.TestKit Driver/Component/ON)
                                                └── Synchronizer (gray-box idle detection)
```

This package provides the **JS-side driver** (device allocation, runtime driver, HDC wrapper, matchers). The **ArkTS native client** (DetoxMain/UiDriver/Synchronizer) is a separate HAR package installed via ohpm.

## Prerequisites

- **DevEco Studio** (includes HarmonyOS SDK API 23/6.1.0 + `hvigorw` + `ohpm` + `hdc`)
- **Node.js 22 LTS** (not Node 24 — RNOH CLI has a `Dirent.path` bug on Node 24)
- **Detox 20.51+** installed in your project
- A connected HarmonyOS device: `hdc list targets` → `<serial>`

## Installation

### 1. Install this driver package

```sh
npm install detox-driver-harmony --save-dev
```

### 2. Install the ArkTS native client (HAR)

Build the HAR from the [detox-openharmony](https://gitcode.com/react-native/detox/tree/main/detox/openHarmony) source, then add it to your app's `oh-package.json5`:

```json5
{
  "dependencies": {
    "@wix/detox-openharmony": "file:path/to/detox_harmony.har"
  }
}
```

### 3. Configure Detox

In your `.detoxrc.js`:

```js
module.exports = {
  configurations: {
    'harmony.debug': {
      device: {
        type: 'detox-driver-harmony',  // ← this package
        device: {
          hdcName: process.env.HARMONY_DEVICE_SN,  // device serial from `hdc list targets`
        },
      },
      app: 'harmony.debug',
    },
  },
  apps: {
    'harmony.debug': {
      type: 'harmony.app',
      binaryPath: 'harmony/entry/build/default/outputs/default/entry-default-signed.hap',
      testBinaryPath: 'harmony/entry/build/default/outputs/ohosTest/entry-ohosTest-signed.hap',
      bundleId: 'com.example.myapp',  // your app's bundleName
    },
  },
};
```

### 4. Wire DetoxMain in your app's ohosTest module

In `entry/src/ohosTest/ets/test/List.test.ets`:

```ts
import { DetoxMain } from '@wix/detox-openharmony';

export default function testsuite() {
  const detoxMain = new DetoxMain();
  // ... extract DetoxServer/DetoxSessionId from launch args
  await detoxMain.run(params);
}
```

See the [demo app](https://gitcode.com/react-native/detox/tree/main/examples/demo-react-native-harmony) for a complete example.

## Usage

```sh
# Set device serial
export HARMONY_DEVICE_SN=<your-device-serial>

# Run tests
detox test --configuration harmony.debug
```

## Environment setup (PowerShell)

If `hvigorw`/`ohpm`/`hdc` are not on your PATH:

```powershell
$env:JAVA_HOME = "C:\Program Files\Huawei\DevEco Studio\jbr"
$env:PATH = "C:\Program Files\Huawei\DevEco Studio\tools\hvigor\bin;C:\Program Files\Huawei\DevEco Studio\tools\ohpm\bin;$env:JAVA_HOME\bin;$env:PATH"
$env:DEVECO_SDK_HOME = "C:\Program Files\Huawei\DevEco Studio\sdk"
```

## Building HAPs

```sh
# Bundle RN JS (Hermes)
cd your-app
npx react-native bundle-harmony --dev=false --js-engine=hermes --hermesc-dir ./node_modules/hermes-compiler/hermesc

# Build HAPs
cd harmony
ohpm install
hvigorw assembleHap --mode module -p product=default -p module=entry@default -p buildMode=debug
hvigorw assembleHap --mode module -p product=default -p module=entry@ohosTest -p buildMode=debug
```

## Signing

HarmonyOS requires signed HAPs for device installation. Generate signing material:

- **DevEco Studio**: File → Project Structure → Signing Configs → "Automatically generate signature"
- **CLI**: `devecocli auth login && devecocli signature generate --product default`

## API coverage

| Category | Status | Notes |
|---|---|---|
| Selectors (`by.id/text/label/type`) | ✅ | Via `ON.id/text/description/type` |
| Actions (`tap/multiTap/longPress/typeText/clearText/replaceText/scroll/scrollTo/swipe`) | ✅ | Via `Component.click/inputText/clearText` + `Driver.swipe` |
| Assertions (`toBeVisible/toExist/toHaveText/toHaveLabel/toHaveId`) | ✅ | Via `findComponent` + bounds/text check |
| Waits (`waitFor/withTimeout/whileElement scroll`) | ✅ | Via `Driver.waitForComponent` |
| Device ops (`launchApp/terminateApp/pressBack/screenshot/orientation/reloadReactNative`) | ✅ | Via `hdc shell aa start/force-stop` + `uitest uiInput` |
| Advanced (`getAttributes/takeScreenshot/setOrientation/sendToHome`) | ✅ | Via `Component.getBounds` + `Driver.screenCap` |
| Gray-box sync | ✅ | Layout hash stability + `Driver.waitForIdle` + AppProbe (network/timer) |

Verified: **61/61 e2e tests pass** on HarmonyOS 6.1.0 (API 23) real device.

## How it works

This package exports three classes that Detox loads via its External driver mechanism:

| Export | Role |
|---|---|
| `DeviceAllocationDriverClass` | Finds free HarmonyOS device via `hdc list targets` |
| `RuntimeDriverClass` | Installs/launches/terminates app via `hdc install`/`aa test`/`aa force-stop`, sets up reverse port forwarding (`hdc rport`) |
| `ExpectClass` | Provides `element`/`expect`/`by`/`waitFor` API (reuses Android's `AndroidExpect` — same FQCN namespace) |

The driver reuses Android's `com.wix.detox.espresso.*` FQCN namespace, so the JS-side invoke protocol is identical. The ArkTS native client interprets these FQCNs and translates them to `@kit.TestKit` API calls.

## License

MIT
