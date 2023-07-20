import {createSession, cleanupSessions} from './remote';

async function main() {
  const { device, expect, element, by } = await createSession({
    server: {
      baseURL: 'http://localhost:4723',
    },
    capabilities: {
      platformName: 'android',
      webSocketUrl: true,
      "detox:apps": {
        "example": {
          "type": "ios.app",
          "name": "example",
          "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/example.app",
          "bundleId": "com.wix.detox-example"
        }
      },
      "detox:behavior": {
        "init": {
          "reinstallApp": true,
          "exposeGlobals": true
        },
        "cleanup": {
          "shutdownDevice": false
        },
        "launchApp": "auto"
      },
      "detox:device": {
        "type": "ios.simulator",
        "headless": false,
        "device": {
          "type": "iPhone 14 Pro Max"
        }
      },
    } as any,
  });

  await device.launchApp();
  await element(by.text('Sanity')).tap();
  await expect(element(by.text('Welcome'))).toBeVisible();
  await device.reloadReactNative();
  await element(by.text('Sanity')).tap();
  await device.relaunchApp();
  await element(by.text('Sanity')).tap();
}

main().finally(cleanupSessions).catch((err) => {
  console.error(err);
  process.exit(1);
});


