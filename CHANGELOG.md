# Change Log

## [12.11.2](https://github.com/wix/Detox/tree/12.11.2) (2019-06-21)
[Full Changelog](https://github.com/wix/Detox/compare/12.11.1...12.11.2)

**Enhancements**

- Update EarlGrey to include TrustKit fixes [\#1392](https://github.com/wix/Detox/issues/1392)
- \(Android\) Introduce exception-based, edge-monitoring in scrolling actions of all flavours \(equiv to iOS\) [\#1464](https://github.com/wix/Detox/pull/1464) ([d4vidi](https://github.com/d4vidi))
- refactor: allow technically to control multiple detox instances  [\#1144](https://github.com/wix/Detox/pull/1144) ([manuquentin](https://github.com/manuquentin))

**Fixed Bugs**

- bug: timeout error on detox.cleanup\(\) if an app had been terminated earlier in a test [\#1460](https://github.com/wix/Detox/issues/1460)
- \(Android\) Endless scrolling attempts if item not found using `waitFor` [\#1409](https://github.com/wix/Detox/issues/1409)

**Closed Issues**

- Second Test File Causing Issues [\#1458](https://github.com/wix/Detox/issues/1458)
- Detox hangs on "Trying permissions" on CircleCI [\#1457](https://github.com/wix/Detox/issues/1457)
- `invocationManager` is cached by nodejs' require cache and prevent multiple client [\#1119](https://github.com/wix/Detox/issues/1119)

**Merged Pull Requests**

- fix\(ws\): explicit error handling [\#1467](https://github.com/wix/Detox/pull/1467) ([noomorph](https://github.com/noomorph))
- fix: conduct cleanup even if app has been already terminated [\#1465](https://github.com/wix/Detox/pull/1465) ([noomorph](https://github.com/noomorph))
- Revive generation script [\#1459](https://github.com/wix/Detox/pull/1459) ([d4vidi](https://github.com/d4vidi))
- Increase log-level for result of 'adb devices' command [\#1453](https://github.com/wix/Detox/pull/1453) ([d4vidi](https://github.com/d4vidi))

## [12.11.1](https://github.com/wix/Detox/tree/12.11.1) (2019-06-14)
[Full Changelog](https://github.com/wix/Detox/compare/12.11.0...12.11.1)

**Closed Issues**

- Regex For Matchers [\#1441](https://github.com/wix/Detox/issues/1441)

**Merged Pull Requests**

- use --byId instead of --simulator [\#1448](https://github.com/wix/Detox/pull/1448) ([vonovak](https://github.com/vonovak))
- Update APIRef.ActionsOnElement.md [\#1437](https://github.com/wix/Detox/pull/1437) ([leotm](https://github.com/leotm))

## [12.11.0](https://github.com/wix/Detox/tree/12.11.0) (2019-06-07)
[Full Changelog](https://github.com/wix/Detox/compare/12.10.3...12.11.0)

**Enhancements**

- Merge demo binaries [\#1430](https://github.com/wix/Detox/pull/1430) ([LeoNatan](https://github.com/LeoNatan))
- Reimplemented SimulatorLogPlugin to use log stream [\#1428](https://github.com/wix/Detox/pull/1428) ([noomorph](https://github.com/noomorph))
- Introduce basic Detox Instruments demo app  [\#1348](https://github.com/wix/Detox/pull/1348) ([rotemmiz](https://github.com/rotemmiz))

**Merged Pull Requests**

- fix\(artifacts\): more precise log recording on iOS and Android [\#1433](https://github.com/wix/Detox/pull/1433) ([noomorph](https://github.com/noomorph))
- Upgrade ws to 3.3.1 or later [\#1432](https://github.com/wix/Detox/pull/1432) ([denissb](https://github.com/denissb))
- Cleanup: Remove residue of pre Xcode 9 simulator boot logic [\#1431](https://github.com/wix/Detox/pull/1431) ([rotemmiz](https://github.com/rotemmiz))
- docs: info on contributing to example projects [\#1413](https://github.com/wix/Detox/pull/1413) ([noomorph](https://github.com/noomorph))

## [12.10.3](https://github.com/wix/Detox/tree/12.10.3) (2019-06-04)
[Full Changelog](https://github.com/wix/Detox/compare/12.10.2...12.10.3)

**Enhancements**

-  Use EarlGrey from fork, rather than official [\#1408](https://github.com/wix/Detox/pull/1408) ([LeoNatan](https://github.com/LeoNatan))

**Fixed Bugs**

- Detox does not load Profiler.framework properly, since it's encrypted [\#1417](https://github.com/wix/Detox/issues/1417)

**Closed Issues**

- Accept Permissions After Log-in Flow  [\#1419](https://github.com/wix/Detox/issues/1419)

**Merged Pull Requests**

- Remove hardcoded RN version [\#1426](https://github.com/wix/Detox/pull/1426) ([d4vidi](https://github.com/d4vidi))
- Fix typo [\#1425](https://github.com/wix/Detox/pull/1425) ([reimertz](https://github.com/reimertz))
- Upgrade example projects to RN59 [\#1423](https://github.com/wix/Detox/pull/1423) ([d4vidi](https://github.com/d4vidi))
- Restricted support in RN .59 [\#1421](https://github.com/wix/Detox/pull/1421) ([d4vidi](https://github.com/d4vidi))
- Reimplement crash-e2e stabilization [\#1414](https://github.com/wix/Detox/pull/1414) ([d4vidi](https://github.com/d4vidi))
- fix: include launch args that come from artifact plugin [\#1412](https://github.com/wix/Detox/pull/1412) ([noomorph](https://github.com/noomorph))
- Introduce parallel e2e tests execution using Jest in Detox demo app \(iOS only\) [\#1394](https://github.com/wix/Detox/pull/1394) ([d4vidi](https://github.com/d4vidi))
- code: logging fixes in detox init [\#1360](https://github.com/wix/Detox/pull/1360) ([noomorph](https://github.com/noomorph))

## [12.10.2](https://github.com/wix/Detox/tree/12.10.2) (2019-05-28)
[Full Changelog](https://github.com/wix/Detox/compare/12.10.1...12.10.2)

## [12.10.1](https://github.com/wix/Detox/tree/12.10.1) (2019-05-28)
[Full Changelog](https://github.com/wix/Detox/compare/12.10.0...12.10.1)

**Merged Pull Requests**

- Make crash e2e more stable [\#1407](https://github.com/wix/Detox/pull/1407) ([d4vidi](https://github.com/d4vidi))
- code: partially remove test snapshots [\#1405](https://github.com/wix/Detox/pull/1405) ([noomorph](https://github.com/noomorph))
- Launch args [\#1385](https://github.com/wix/Detox/pull/1385) ([d4vidi](https://github.com/d4vidi))

## [12.10.0](https://github.com/wix/Detox/tree/12.10.0) (2019-05-27)
[Full Changelog](https://github.com/wix/Detox/compare/12.9.0...12.10.0)

**Enhancements**

- \(Android\) Native error reporting [\#1213](https://github.com/wix/Detox/issues/1213)
- Update EarlGrey to latest version, including TrustKit fixes [\#1402](https://github.com/wix/Detox/pull/1402) ([LeoNatan](https://github.com/LeoNatan))

**Fixed Bugs**

- device.reloadReactNative crashes on RN 0.59.8 [\#1391](https://github.com/wix/Detox/issues/1391)

**Closed Issues**

- .dtxrec are not created if the performance recording was initially started via launch args [\#1339](https://github.com/wix/Detox/issues/1339)

**Merged Pull Requests**

- Removed triggering of instruments recording  \(--record-performance\) for apps launched in before/beforeApp scopes [\#1400](https://github.com/wix/Detox/pull/1400) ([rotemmiz](https://github.com/rotemmiz))

## [12.9.0](https://github.com/wix/Detox/tree/12.9.0) (2019-05-22)
[Full Changelog](https://github.com/wix/Detox/compare/12.8.0...12.9.0)

**Enhancements**

- Add rebuild-framework-cache command to local CLI [\#1390](https://github.com/wix/Detox/pull/1390) ([LeoNatan](https://github.com/LeoNatan))
- Web Socket Connection Retry [\#1389](https://github.com/wix/Detox/pull/1389) ([LeoNatan](https://github.com/LeoNatan))

**Fixed Bugs**

- Profiler does not record network requests even if told to \(by code from Detox.framework\) [\#1379](https://github.com/wix/Detox/issues/1379)
- Detox fails with TrustKit integrated [\#721](https://github.com/wix/Detox/issues/721)

**Closed Issues**

- android build.gradle's wildcard dependencies means builds not reproducible / fail [\#1380](https://github.com/wix/Detox/issues/1380)
- Cannot enable notification permissions [\#1368](https://github.com/wix/Detox/issues/1368)
- Detox tests are flaky in CI [\#126](https://github.com/wix/Detox/issues/126)

**Merged Pull Requests**

- Cancel explicit deps in okio and okhttp [\#1397](https://github.com/wix/Detox/pull/1397) ([d4vidi](https://github.com/d4vidi))

## [12.8.0](https://github.com/wix/Detox/tree/12.8.0) (2019-05-13)
[Full Changelog](https://github.com/wix/Detox/compare/12.7.1...12.8.0)

## [12.7.1](https://github.com/wix/Detox/tree/12.7.1) (2019-05-13)
[Full Changelog](https://github.com/wix/Detox/compare/12.7.0...12.7.1)

## [12.7.0](https://github.com/wix/Detox/tree/12.7.0) (2019-05-08)
[Full Changelog](https://github.com/wix/Detox/compare/v12.7.0...12.7.0)

## [v12.7.0](https://github.com/wix/Detox/tree/v12.7.0) (2019-05-08)
[Full Changelog](https://github.com/wix/Detox/compare/12.6.3...v12.7.0)

**Enhancements**

- Improve Jest's console output flow [\#1349](https://github.com/wix/Detox/issues/1349)

**Fixed Bugs**

- Conflict with dependency 'org.jetbrains.kotlin:kotlin-stdlib' in project ':app'. [\#1257](https://github.com/wix/Detox/issues/1257)

**Closed Issues**

- package com.wix.detox does not exist even though it is added under dependencies [\#1367](https://github.com/wix/Detox/issues/1367)
- Detox globals no longer available in utility functions \(outside of tests\) [\#1353](https://github.com/wix/Detox/issues/1353)

**Merged Pull Requests**

- Improve integ. with Jest in terms of logging [\#1351](https://github.com/wix/Detox/pull/1351) ([d4vidi](https://github.com/d4vidi))

## [12.6.3](https://github.com/wix/Detox/tree/12.6.3) (2019-05-06)
[Full Changelog](https://github.com/wix/Detox/compare/12.6.2...12.6.3)

**Merged Pull Requests**

- \(Android\) Revisit kotlin stdlib issue fix for projects compiling detox [\#1363](https://github.com/wix/Detox/pull/1363) ([d4vidi](https://github.com/d4vidi))

## [12.6.2](https://github.com/wix/Detox/tree/12.6.2) (2019-05-05)
[Full Changelog](https://github.com/wix/Detox/compare/12.6.1...12.6.2)

**Closed Issues**

- Can you not show the Hierarchy section when having an error? [\#1350](https://github.com/wix/Detox/issues/1350)

**Merged Pull Requests**

- lint: fix intellisense warning [\#1359](https://github.com/wix/Detox/pull/1359) ([noomorph](https://github.com/noomorph))
- fix: ensure cleanup cannot be called twice [\#1358](https://github.com/wix/Detox/pull/1358) ([noomorph](https://github.com/noomorph))
- test: remove jest workaround in e2e [\#1357](https://github.com/wix/Detox/pull/1357) ([noomorph](https://github.com/noomorph))
- fix: use newlines in generated files [\#1356](https://github.com/wix/Detox/pull/1356) ([noomorph](https://github.com/noomorph))

## [12.6.1](https://github.com/wix/Detox/tree/12.6.1) (2019-05-01)
[Full Changelog](https://github.com/wix/Detox/compare/12.6.0...12.6.1)

**Enhancements**

- Record network and events in Detox Instruments artifacts [\#1333](https://github.com/wix/Detox/pull/1333) ([noomorph](https://github.com/noomorph))

**Merged Pull Requests**

- ci: collect code coverage from e2e [\#1317](https://github.com/wix/Detox/pull/1317) ([noomorph](https://github.com/noomorph))

## [12.6.0](https://github.com/wix/Detox/tree/12.6.0) (2019-04-30)
[Full Changelog](https://github.com/wix/Detox/compare/12.5.0...12.6.0)

**Closed Issues**

- Android release build not get detected though it is already build [\#1343](https://github.com/wix/Detox/issues/1343)

**Merged Pull Requests**

- feat: DETOX\_INSTRUMENTS\_PATH environment variable [\#1344](https://github.com/wix/Detox/pull/1344) ([noomorph](https://github.com/noomorph))

## [12.5.0](https://github.com/wix/Detox/tree/12.5.0) (2019-04-28)
[Full Changelog](https://github.com/wix/Detox/compare/12.4.1...12.5.0)

**Fixed Bugs**

- Detox is not showing which expectation failed [\#1263](https://github.com/wix/Detox/issues/1263)

**Closed Issues**

- Log artifacts is empty. [\#1326](https://github.com/wix/Detox/issues/1326)

**Merged Pull Requests**

- code: print a warning instead of an error if artifact files are not found [\#1341](https://github.com/wix/Detox/pull/1341) ([noomorph](https://github.com/noomorph))
- fix: error stack traces in Jest [\#1336](https://github.com/wix/Detox/pull/1336) ([noomorph](https://github.com/noomorph))
- feat: support for DETOX\_INSTRUMENTS\_PATH environment variable [\#1332](https://github.com/wix/Detox/pull/1332) ([noomorph](https://github.com/noomorph))

## [12.4.1](https://github.com/wix/Detox/tree/12.4.1) (2019-04-23)
[Full Changelog](https://github.com/wix/Detox/compare/12.4.0...12.4.1)

**Enhancements**

- Allow Regular Expressions in Jest Runner [\#1081](https://github.com/wix/Detox/issues/1081)
- Detox CLI: allow overriding issued args to a test runner with the ones the user specifies after -- argument [\#876](https://github.com/wix/Detox/issues/876)
- Provide mechanism to pass test match patterns runner-agnostic via Detox CLI [\#588](https://github.com/wix/Detox/issues/588)

**Fixed Bugs**

- URL with multiple arguments is not passed correctly to iOS [\#1294](https://github.com/wix/Detox/issues/1294)
- Detox android examples fail in Linux [\#1058](https://github.com/wix/Detox/issues/1058)

**Closed Issues**

- Testing WebViews on RN iOS app [\#1316](https://github.com/wix/Detox/issues/1316)
- CI: add demo-projects-android build [\#1313](https://github.com/wix/Detox/issues/1313)

**Merged Pull Requests**

- \(Android\) Switch example projects to use .aar [\#1327](https://github.com/wix/Detox/pull/1327) ([d4vidi](https://github.com/d4vidi))
- \(Android\) Restore example project tests in CI \(context: issue \#1323\) [\#1325](https://github.com/wix/Detox/pull/1325) ([d4vidi](https://github.com/d4vidi))
- \(Android\) Introduce android build-artifacts' packaging \(.aar, source, docs\) [\#1322](https://github.com/wix/Detox/pull/1322) ([d4vidi](https://github.com/d4vidi))
- Fix `startPositionY ` typo [\#1321](https://github.com/wix/Detox/pull/1321) ([yurtaev](https://github.com/yurtaev))

## [12.4.0](https://github.com/wix/Detox/tree/12.4.0) (2019-04-18)
[Full Changelog](https://github.com/wix/Detox/compare/12.3.0...12.4.0)

**Enhancements**

- detox init removes final newline in package.json [\#1272](https://github.com/wix/Detox/issues/1272)
- Runner agnostic file targeting [\#512](https://github.com/wix/Detox/issues/512)
- Detox Instruments Integration \(Phase 1\) [\#1165](https://github.com/wix/Detox/pull/1165) ([LeoNatan](https://github.com/LeoNatan))

**Fixed Bugs**

- Can't use .scroll\(\) and .swipe\(\) for MapView from react-native-maps [\#250](https://github.com/wix/Detox/issues/250)

**Closed Issues**

- Bots in this repository [\#1305](https://github.com/wix/Detox/issues/1305)
- Reopen \#992, disable stale bot [\#1304](https://github.com/wix/Detox/issues/1304)
- Plugin system to hooks inside the native code in some ways [\#1303](https://github.com/wix/Detox/issues/1303)
- device.terminateApp results in ChildProcessError [\#1296](https://github.com/wix/Detox/issues/1296)
- replaceText does not trigger TextInput's onChangeText event \(multiline\) [\#1292](https://github.com/wix/Detox/issues/1292)
- React native navigation stalling [\#1287](https://github.com/wix/Detox/issues/1287)
- The flag --take-screenshots=all fails with React-Native 0.59.4 [\#1286](https://github.com/wix/Detox/issues/1286)
- Detox and TrustKit - Signal 6 was raised [\#1285](https://github.com/wix/Detox/issues/1285)
- ios detox execution hangs with 'failed to add line to log:' [\#1142](https://github.com/wix/Detox/issues/1142)
- Biometric authentication cannot be cancelled [\#1121](https://github.com/wix/Detox/issues/1121)
- Limit printing of EarlGrey errors [\#992](https://github.com/wix/Detox/issues/992)
- Detox CLI: Replace commander with argparse [\#767](https://github.com/wix/Detox/issues/767)
- Detox crash due to prettyPrint in AppStateTracker [\#644](https://github.com/wix/Detox/issues/644)
- Perform actions on device [\#635](https://github.com/wix/Detox/issues/635)
- Enable detox-server to bind to something different than localhost [\#526](https://github.com/wix/Detox/issues/526)
- Back button on Android [\#463](https://github.com/wix/Detox/issues/463)
- Add environ for `device.launchApp` [\#376](https://github.com/wix/Detox/issues/376)
- Testing elements with the same testID/AccessibilityLabel ? [\#206](https://github.com/wix/Detox/issues/206)

**Merged Pull Requests**

- ci: upgrade to Mocha 6 [\#1308](https://github.com/wix/Detox/pull/1308) ([noomorph](https://github.com/noomorph))
- ci\(android\): fix demo-react-native project [\#1307](https://github.com/wix/Detox/pull/1307) ([noomorph](https://github.com/noomorph))
- Fix for supporting multiple URL arguments for device.launchApp [\#1302](https://github.com/wix/Detox/pull/1302) ([kennym](https://github.com/kennym))
- fix: upgrade configs for Jest 24 [\#1301](https://github.com/wix/Detox/pull/1301) ([noomorph](https://github.com/noomorph))
- ci: fix demo-react-native-jest build script [\#1299](https://github.com/wix/Detox/pull/1299) ([noomorph](https://github.com/noomorph))
- ci: upgrade to mocha 6 in the test project [\#1298](https://github.com/wix/Detox/pull/1298) ([noomorph](https://github.com/noomorph))
- docs\(APIRef.DetoxCLI\) fix: missing - for options [\#1295](https://github.com/wix/Detox/pull/1295) ([guhungry](https://github.com/guhungry))
- feat: undeprecate "specs" in package.json [\#1290](https://github.com/wix/Detox/pull/1290) ([noomorph](https://github.com/noomorph))
- fix: append newline to package.json on detox init [\#1282](https://github.com/wix/Detox/pull/1282) ([noomorph](https://github.com/noomorph))
- Fix invalid tag inside docs [\#1139](https://github.com/wix/Detox/pull/1139) ([vadimshvetsov](https://github.com/vadimshvetsov))

## [12.3.0](https://github.com/wix/Detox/tree/12.3.0) (2019-04-15)
[Full Changelog](https://github.com/wix/Detox/compare/12.2.1...12.3.0)

**Enhancements**

- device.takeScreenshot\(x\) doesn't work if --take-screenshots none is specified \(which is the default\) [\#1278](https://github.com/wix/Detox/issues/1278)

**Merged Pull Requests**

- feat: --take-screenshot manual mode by default [\#1281](https://github.com/wix/Detox/pull/1281) ([noomorph](https://github.com/noomorph))
- code: omit passing explicitly default command-line args to test runners [\#1280](https://github.com/wix/Detox/pull/1280) ([noomorph](https://github.com/noomorph))
- fix\(android\): install APK with a file path that needs escaping [\#1276](https://github.com/wix/Detox/pull/1276) ([mrgoodrich](https://github.com/mrgoodrich))

## [12.2.1](https://github.com/wix/Detox/tree/12.2.1) (2019-04-14)
[Full Changelog](https://github.com/wix/Detox/compare/12.2.0...12.2.1)

## [12.2.0](https://github.com/wix/Detox/tree/12.2.0) (2019-04-12)
[Full Changelog](https://github.com/wix/Detox/compare/12.1.4-screenshots-beta...12.2.0)

**Enhancements**

- Provide API for taking screenshots on demand [\#807](https://github.com/wix/Detox/issues/807)

**Merged Pull Requests**

- feat: device.takeScreenshot\(name\) [\#904](https://github.com/wix/Detox/pull/904) ([noomorph](https://github.com/noomorph))

## [12.1.4-screenshots-beta](https://github.com/wix/Detox/tree/12.1.4-screenshots-beta) (2019-04-11)
[Full Changelog](https://github.com/wix/Detox/compare/12.1.4-screenshot...12.1.4-screenshots-beta)

## [12.1.4-screenshot](https://github.com/wix/Detox/tree/12.1.4-screenshot) (2019-04-11)
[Full Changelog](https://github.com/wix/Detox/compare/12.1.4...12.1.4-screenshot)

**Fixed Bugs**

- Detox CLI does not error on unknown commands [\#149](https://github.com/wix/Detox/issues/149)

## [12.1.4](https://github.com/wix/Detox/tree/12.1.4) (2019-04-11)
[Full Changelog](https://github.com/wix/Detox/compare/12.1.3...12.1.4)

**Closed Issues**

- View Hierarchy dump is an impediment to adoption [\#1227](https://github.com/wix/Detox/issues/1227)
- Detox doesn't work with React-Native 0.59 on Android [\#1208](https://github.com/wix/Detox/issues/1208)

**Merged Pull Requests**

- fix: stabilize simulator log plugin [\#1273](https://github.com/wix/Detox/pull/1273) ([noomorph](https://github.com/noomorph))
- code: lower status of artifact manager errors [\#1271](https://github.com/wix/Detox/pull/1271) ([noomorph](https://github.com/noomorph))
- hotfix: redundant logs in the folder [\#1268](https://github.com/wix/Detox/pull/1268) ([noomorph](https://github.com/noomorph))
- fix: e2e test on timezones different from LA [\#1267](https://github.com/wix/Detox/pull/1267) ([noomorph](https://github.com/noomorph))
- fix: simulator log plugin issue [\#1261](https://github.com/wix/Detox/pull/1261) ([noomorph](https://github.com/noomorph))

## [12.1.3](https://github.com/wix/Detox/tree/12.1.3) (2019-04-04)
[Full Changelog](https://github.com/wix/Detox/compare/12.1.2...12.1.3)

**Enhancements**

- Migrate uiautomator to AndroidX [\#1235](https://github.com/wix/Detox/issues/1235)
- Introduce proguard minification into test app [\#1216](https://github.com/wix/Detox/issues/1216)

**Closed Issues**

- CircleCI: Reports test failure but command exits with success code \(0\) [\#1252](https://github.com/wix/Detox/issues/1252)
- Getting an error when running Detox - yargs [\#1250](https://github.com/wix/Detox/issues/1250)

**Merged Pull Requests**

- \(Android\) Migrate UIAutomator to AndroidX \(\#1235\) [\#1251](https://github.com/wix/Detox/pull/1251) ([d4vidi](https://github.com/d4vidi))
- \(Android\) Introduce Proguard all-around [\#1249](https://github.com/wix/Detox/pull/1249) ([d4vidi](https://github.com/d4vidi))
- Migrate uiautomator to AndroidX [\#1242](https://github.com/wix/Detox/pull/1242) ([leanmazzu](https://github.com/leanmazzu))

## [12.1.2](https://github.com/wix/Detox/tree/12.1.2) (2019-04-02)
[Full Changelog](https://github.com/wix/Detox/compare/12.1.1...12.1.2)

**Enhancements**

- feat: specify resuing existing app in Detox.init\(\) params [\#1245](https://github.com/wix/Detox/pull/1245) ([Ponyets](https://github.com/Ponyets))

**Fixed Bugs**

- `detox test` fails without status code [\#1247](https://github.com/wix/Detox/issues/1247)
- iOS keyWindow.rootViewController would be null when app is driven by Detox. [\#1230](https://github.com/wix/Detox/issues/1230)
- Taps do not register on iOS simulator [\#1224](https://github.com/wix/Detox/issues/1224)

**Closed Issues**

- How to pass -disableRNTestingOverride 1 to tests? [\#1243](https://github.com/wix/Detox/issues/1243)
- Error: Can't find a simulator to match with "iPhone 7" [\#1241](https://github.com/wix/Detox/issues/1241)
- React Navigation v3.3.1 SafeAreaView update breaks scroll\('down'\) \(iOS only\) [\#1196](https://github.com/wix/Detox/issues/1196)

**Merged Pull Requests**

- Exit process with error status code when a cli command fails [\#1248](https://github.com/wix/Detox/pull/1248) ([tancredi](https://github.com/tancredi))
- Fix keyWindow.rootViewController nullability on iOS [\#1231](https://github.com/wix/Detox/pull/1231) ([Ponyets](https://github.com/Ponyets))
- Fix main.jsbundle does not exist [\#1190](https://github.com/wix/Detox/pull/1190) ([msand](https://github.com/msand))

## [12.1.1](https://github.com/wix/Detox/tree/12.1.1) (2019-03-27)
[Full Changelog](https://github.com/wix/Detox/compare/12.1.0...12.1.1)

**Fixed Bugs**

- App crashes when Detox navigates to a Webview [\#1240](https://github.com/wix/Detox/issues/1240)

## [12.1.0](https://github.com/wix/Detox/tree/12.1.0) (2019-03-27)
[Full Changelog](https://github.com/wix/Detox/compare/v12.0.0...12.1.0)

**Fixed Bugs**

- Animations are not firing after upgrading to React Native 0.59.2 [\#1234](https://github.com/wix/Detox/issues/1234)

**Closed Issues**

- Announcement: Detox now requires Xcode 10.1 [\#1202](https://github.com/wix/Detox/issues/1202)
- pass in files to the cli like jest and mocha do by default [\#1132](https://github.com/wix/Detox/issues/1132)

**Merged Pull Requests**

- Switch CLI to yargs [\#1109](https://github.com/wix/Detox/pull/1109) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [v12.0.0](https://github.com/wix/Detox/tree/v12.0.0) (2019-03-26)
[Full Changelog](https://github.com/wix/Detox/compare/11.0.2...v12.0.0)

**Fixed Bugs**

- Error detox on Xcode 10.2 [\#1229](https://github.com/wix/Detox/issues/1229)
- Incorrect emulator path resolution on Windows [\#1222](https://github.com/wix/Detox/issues/1222)

**Closed Issues**

- Can't install/upgrade detox on Xcode 10.2 [\#1228](https://github.com/wix/Detox/issues/1228)
- getValue/getText API should be added as part of Detox e2e suite [\#1226](https://github.com/wix/Detox/issues/1226)
- device.relaunchApp was supposedly removed as of Detox 6, but still is defined [\#1217](https://github.com/wix/Detox/issues/1217)
- boolean result of expect\(\) api  [\#1214](https://github.com/wix/Detox/issues/1214)
- Detox doesn't work with React-Native 0.59 + React-Navigation [\#1207](https://github.com/wix/Detox/issues/1207)
- Mock Android notifications [\#592](https://github.com/wix/Detox/issues/592)

**Merged Pull Requests**

- fix: emulator.exe path resolution on Windows [\#1223](https://github.com/wix/Detox/pull/1223) ([noomorph](https://github.com/noomorph))
- Corrected typo. [\#1221](https://github.com/wix/Detox/pull/1221) ([Dergel0806](https://github.com/Dergel0806))
- Fix "ir" typo. [\#1218](https://github.com/wix/Detox/pull/1218) ([joshuapinter](https://github.com/joshuapinter))
- Update APIRef.Matchers.md [\#1205](https://github.com/wix/Detox/pull/1205) ([vonovak](https://github.com/vonovak))

## [11.0.2](https://github.com/wix/Detox/tree/11.0.2) (2019-03-19)
[Full Changelog](https://github.com/wix/Detox/compare/11.0.1...11.0.2)

**Merged Pull Requests**

- Restore UIAutomator as an external file in Android generation [\#1210](https://github.com/wix/Detox/pull/1210) ([d4vidi](https://github.com/d4vidi))

## [11.0.1](https://github.com/wix/Detox/tree/11.0.1) (2019-03-18)
[Full Changelog](https://github.com/wix/Detox/compare/11.0.0...11.0.1)

**Enhancements**

- End support in RN .44, .45 [\#1203](https://github.com/wix/Detox/issues/1203)
- Migrate to Android jetpack \(androidx\) [\#1173](https://github.com/wix/Detox/issues/1173)

**Closed Issues**

- Stop forcing -gpu host when launching android emulator [\#1176](https://github.com/wix/Detox/issues/1176)

**Merged Pull Requests**

- \(Android\) Make RN .46 the new minimal version \(i.e. stop support for 44, .45\) [\#1209](https://github.com/wix/Detox/pull/1209) ([d4vidi](https://github.com/d4vidi))
- PR \(Issue \#1176\) - Stop Forcing -gpu host on android emulators [\#1177](https://github.com/wix/Detox/pull/1177) ([RyanThomas73](https://github.com/RyanThomas73))

## [11.0.0](https://github.com/wix/Detox/tree/11.0.0) (2019-03-13)
[Full Changelog](https://github.com/wix/Detox/compare/10.0.13...11.0.0)

**Closed Issues**

- Detox init error in CircleCI. [\#1191](https://github.com/wix/Detox/issues/1191)

**Merged Pull Requests**

- fix: correct ordering of accessibility traits [\#1198](https://github.com/wix/Detox/pull/1198) ([ximenean](https://github.com/ximenean))
- \(Android\) Migrate instrumentation support lib to androidx libs [\#1193](https://github.com/wix/Detox/pull/1193) ([d4vidi](https://github.com/d4vidi))

## [10.0.13](https://github.com/wix/Detox/tree/10.0.13) (2019-03-11)
[Full Changelog](https://github.com/wix/Detox/compare/10.0.12...10.0.13)

**Enhancements**

- Issue with \_queryPID function [\#1100](https://github.com/wix/Detox/issues/1100)

**Closed Issues**

- Device should be booted only when we change the permission status  [\#1188](https://github.com/wix/Detox/issues/1188)

**Merged Pull Requests**

- Resolves \#1100 [\#1189](https://github.com/wix/Detox/pull/1189) ([noomorph](https://github.com/noomorph))

## [10.0.12](https://github.com/wix/Detox/tree/10.0.12) (2019-03-03)
[Full Changelog](https://github.com/wix/Detox/compare/10.0.11...10.0.12)

**Fixed Bugs**

- Stabilize flaky self animations e2e on Android [\#1171](https://github.com/wix/Detox/issues/1171)
- Postinstall installation error build\_framework.ios.sh [\#1092](https://github.com/wix/Detox/issues/1092)

**Closed Issues**

- Detox error running tests on real Android device [\#1174](https://github.com/wix/Detox/issues/1174)
- toHaveText\(\) not working with Expo [\#1168](https://github.com/wix/Detox/issues/1168)
- Postinstall fails on missing simulator runtimes [\#1167](https://github.com/wix/Detox/issues/1167)

**Merged Pull Requests**

- Android: Stabilize animations short-timer e2e \(minor change in timers IR\) - fix \#1171 [\#1186](https://github.com/wix/Detox/pull/1186) ([d4vidi](https://github.com/d4vidi))

## [10.0.11](https://github.com/wix/Detox/tree/10.0.11) (2019-02-25)
[Full Changelog](https://github.com/wix/Detox/compare/10.0.10...10.0.11)

## [10.0.10](https://github.com/wix/Detox/tree/10.0.10) (2019-02-25)
[Full Changelog](https://github.com/wix/Detox/compare/10.0.9...10.0.10)

**Closed Issues**

- Xcode 9.4.1 timeout with demo-react-native-jest [\#1087](https://github.com/wix/Detox/issues/1087)

## [10.0.9](https://github.com/wix/Detox/tree/10.0.9) (2019-02-18)
[Full Changelog](https://github.com/wix/Detox/compare/10.0.8...10.0.9)

## [10.0.8](https://github.com/wix/Detox/tree/10.0.8) (2019-02-17)
[Full Changelog](https://github.com/wix/Detox/compare/10.0.7-snapshot.299...10.0.8)

**Closed Issues**

- Unable to setup Detox in an Expo project [\#1159](https://github.com/wix/Detox/issues/1159)
- ANDROID ONLY: Errors syncing android project with dependencies for react native 0.58.3 and detox [\#1156](https://github.com/wix/Detox/issues/1156)

**Merged Pull Requests**

- Remove old warning about Android issues on RN \>= 0.50 [\#1158](https://github.com/wix/Detox/pull/1158) ([brunobar79](https://github.com/brunobar79))
- Android: Refactor detox manager \(complete work starting in 46de13d0\) [\#1151](https://github.com/wix/Detox/pull/1151) ([d4vidi](https://github.com/d4vidi))

## [10.0.7-snapshot.299](https://github.com/wix/Detox/tree/10.0.7-snapshot.299) (2019-02-13)
[Full Changelog](https://github.com/wix/Detox/compare/10.0.7-snapshot.293...10.0.7-snapshot.299)

## [10.0.7-snapshot.293](https://github.com/wix/Detox/tree/10.0.7-snapshot.293) (2019-02-13)
[Full Changelog](https://github.com/wix/Detox/compare/10.0.7...10.0.7-snapshot.293)

**Closed Issues**

- device.launchApp\(\) ends too soon on Android [\#1149](https://github.com/wix/Detox/issues/1149)

## [10.0.7](https://github.com/wix/Detox/tree/10.0.7) (2019-02-11)
[Full Changelog](https://github.com/wix/Detox/compare/10.0.6...10.0.7)

## [10.0.6](https://github.com/wix/Detox/tree/10.0.6) (2019-02-11)
[Full Changelog](https://github.com/wix/Detox/compare/10.0.5...10.0.6)

**Enhancements**

- Improve the way we can interract with react-native-maps [\#1105](https://github.com/wix/Detox/issues/1105)

**Fixed Bugs**

- Resuming the app with a url causes detox to hang and time-out [\#1125](https://github.com/wix/Detox/issues/1125)

**Closed Issues**

- unable to install detox 9.0.4 with XCode 10.1 [\#1145](https://github.com/wix/Detox/issues/1145)
- Scrolling and navigation takes too much time while running detox test in emulator  [\#1141](https://github.com/wix/Detox/issues/1141)
- Button text matching fails on Android due to default all-caps styling [\#1135](https://github.com/wix/Detox/issues/1135)
- Does Detox work with React Native 0.58.0-rc.2? [\#1126](https://github.com/wix/Detox/issues/1126)
- Bring back printing of device logs location [\#1110](https://github.com/wix/Detox/issues/1110)

**Merged Pull Requests**

- Idle wait before ready [\#1150](https://github.com/wix/Detox/pull/1150) ([d4vidi](https://github.com/d4vidi))
- Select date on IOS UIDatePicker with actionForSetDate [\#1148](https://github.com/wix/Detox/pull/1148) ([matthewrfindley](https://github.com/matthewrfindley))
- code: print simulator launch message to info [\#1127](https://github.com/wix/Detox/pull/1127) ([noomorph](https://github.com/noomorph))
- iOS: Add pinch actions [\#1104](https://github.com/wix/Detox/pull/1104) ([sraikimaxime](https://github.com/sraikimaxime))

## [10.0.5](https://github.com/wix/Detox/tree/10.0.5) (2019-01-28)
[Full Changelog](https://github.com/wix/Detox/compare/10.0.4...10.0.5)

## [10.0.4](https://github.com/wix/Detox/tree/10.0.4) (2019-01-28)
[Full Changelog](https://github.com/wix/Detox/compare/10.0.3...10.0.4)

## [10.0.3](https://github.com/wix/Detox/tree/10.0.3) (2019-01-28)
[Full Changelog](https://github.com/wix/Detox/compare/10.0.2...10.0.3)

**Fixed Bugs**

- Idle timer shadows busy timers at rare cases [\#1115](https://github.com/wix/Detox/issues/1115)

**Closed Issues**

- TypeError: expect\(...\).typeText is not a function. Checked issue \#326 . Not seems to be similar issue.  [\#1130](https://github.com/wix/Detox/issues/1130)
- Running Detox build command shows following ERROR \#detox [\#1123](https://github.com/wix/Detox/issues/1123)
- FAILURE: Plugin with id 'kotlin-android' not found. [\#1122](https://github.com/wix/Detox/issues/1122)
- Improve Mocking Documentation to include `detox build` [\#1116](https://github.com/wix/Detox/issues/1116)

**Merged Pull Requests**

- Fix issues related to single-task activities [\#1128](https://github.com/wix/Detox/pull/1128) ([d4vidi](https://github.com/d4vidi))
-  Allow Regular Expressions in Jest Runner [\#1083](https://github.com/wix/Detox/pull/1083) ([RCiesielczuk](https://github.com/RCiesielczuk))

## [10.0.2](https://github.com/wix/Detox/tree/10.0.2) (2019-01-14)
[Full Changelog](https://github.com/wix/Detox/compare/9.1.2...10.0.2)

**Enhancements**

- Support for pressing Delete key on Android [\#1039](https://github.com/wix/Detox/issues/1039)
- Run individual Detox test [\#536](https://github.com/wix/Detox/issues/536)
- Expectation/matcher for the app being in background? [\#226](https://github.com/wix/Detox/issues/226)
- CLI: Add pass through test runner arguments  [\#1025](https://github.com/wix/Detox/pull/1025) ([EdwardDrapkin](https://github.com/EdwardDrapkin))

**Closed Issues**

- SimulatorKit.SimDisplayScreenshotWriter.ScreenshotError when taking screenshot [\#1118](https://github.com/wix/Detox/issues/1118)
- It should be configurable to hide Hierachy on failure. [\#1113](https://github.com/wix/Detox/issues/1113)
- Detox build failed - with solution [\#1111](https://github.com/wix/Detox/issues/1111)
- No instrumentation runner found on device [\#1106](https://github.com/wix/Detox/issues/1106)
- Firebase, react\_native projects causes unreasonable long load time or timeout [\#1095](https://github.com/wix/Detox/issues/1095)
- Installation crashes with "$\""" failed with code = 1, stdout and stderr:" error [\#1094](https://github.com/wix/Detox/issues/1094)
- windows [\#1088](https://github.com/wix/Detox/issues/1088)
- Handling the inbuilt app of OS  [\#1086](https://github.com/wix/Detox/issues/1086)
- Extra tap for focusing a focused input - cant delete input value. [\#1075](https://github.com/wix/Detox/issues/1075)
- resetContentAndSettings freezes simulator [\#1059](https://github.com/wix/Detox/issues/1059)
- Detox integration with jest - Jest did not exit one second after the test run has completed. [\#1046](https://github.com/wix/Detox/issues/1046)
- iOS test hangs on splash screen and crashes. [\#1042](https://github.com/wix/Detox/issues/1042)
- Unable to create new device when running parallel tests Jest [\#1004](https://github.com/wix/Detox/issues/1004)
- Move Android Interactions to generated code [\#726](https://github.com/wix/Detox/issues/726)

**Merged Pull Requests**

- Fix typo [\#1117](https://github.com/wix/Detox/pull/1117) ([hirejohnsalcedo](https://github.com/hirejohnsalcedo))
- Update APIRef.Matchers.md [\#1112](https://github.com/wix/Detox/pull/1112) ([joegoodall2](https://github.com/joegoodall2))
- Fix typo in APIRef.DetoxObjectAPI.md [\#1090](https://github.com/wix/Detox/pull/1090) ([lukasgjetting](https://github.com/lukasgjetting))
- Set consistent semicolon style in firstTestContent [\#1089](https://github.com/wix/Detox/pull/1089) ([CodingItWrong](https://github.com/CodingItWrong))
- Introduce kotlin and reimplement RN-timers idling resource [\#1085](https://github.com/wix/Detox/pull/1085) ([d4vidi](https://github.com/d4vidi))
- Fixing typo [\#1079](https://github.com/wix/Detox/pull/1079) ([bward2](https://github.com/bward2))
- Fix typo in pr template [\#1054](https://github.com/wix/Detox/pull/1054) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Android Sync: Improve RN-timers idling resource such that it would skip over interval-timers [\#1048](https://github.com/wix/Detox/pull/1048) ([d4vidi](https://github.com/d4vidi))
- Android: allow test packages \(built for emulator by Android Studio\) to be installed via adb [\#1015](https://github.com/wix/Detox/pull/1015) ([Annihil](https://github.com/Annihil))
- Android: Move expect.js to generated code [\#746](https://github.com/wix/Detox/pull/746) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [9.1.2](https://github.com/wix/Detox/tree/9.1.2) (2018-11-16)
[Full Changelog](https://github.com/wix/Detox/compare/9.0.8...9.1.2)

**Enhancements**

- New Actions: `tapBackspaceKey` and `tapReturnKey` [\#1044](https://github.com/wix/Detox/pull/1044) ([michaelgmcd](https://github.com/michaelgmcd))

## [9.0.8](https://github.com/wix/Detox/tree/9.0.8) (2018-11-15)
[Full Changelog](https://github.com/wix/Detox/compare/v9.0.8...9.0.8)

## [v9.0.8](https://github.com/wix/Detox/tree/v9.0.8) (2018-11-15)
[Full Changelog](https://github.com/wix/Detox/compare/9.0.7...v9.0.8)

**Enhancements**

- Detox configuration should allow ability to specify app apk path and androidTest apk path [\#571](https://github.com/wix/Detox/issues/571)

## [9.0.7](https://github.com/wix/Detox/tree/9.0.7) (2018-11-14)
[Full Changelog](https://github.com/wix/Detox/compare/v9.0.6...9.0.7)

**Enhancements**

- iOS: Synchronization over waitForBackground and waitForActive states  [\#1036](https://github.com/wix/Detox/pull/1036) ([LeoNatan](https://github.com/LeoNatan))

**Fixed Bugs**

- \_prettyPrintAppStateTracker crash [\#1002](https://github.com/wix/Detox/issues/1002)
- fix: enable acquiring an already attached emulator by ADB name [\#1028](https://github.com/wix/Detox/pull/1028) ([noomorph](https://github.com/noomorph))

**Closed Issues**

- Detox clears async storage  [\#1040](https://github.com/wix/Detox/issues/1040)
- Detox not run in offline mode [\#1029](https://github.com/wix/Detox/issues/1029)
- pre-started android emulator support [\#1027](https://github.com/wix/Detox/issues/1027)
- timezone [\#1018](https://github.com/wix/Detox/issues/1018)
- Sign in with google [\#1016](https://github.com/wix/Detox/issues/1016)

**Merged Pull Requests**

- Android: Increase RN-timers idling resources look-ahead to 1.5sec [\#1037](https://github.com/wix/Detox/pull/1037) ([d4vidi](https://github.com/d4vidi))
- Update More.AndroidSupportStatus.md [\#1033](https://github.com/wix/Detox/pull/1033) ([carbonjesse](https://github.com/carbonjesse))
- Fix typo [\#1026](https://github.com/wix/Detox/pull/1026) ([sealedHuman](https://github.com/sealedHuman))
- update expo usage guides [\#1017](https://github.com/wix/Detox/pull/1017) ([quinlanj](https://github.com/quinlanj))
- Go back to running Detox e2e suite with Mocha [\#1012](https://github.com/wix/Detox/pull/1012) ([rotemmiz](https://github.com/rotemmiz))
- Added testBinaryPath as an optional config parameter [\#1007](https://github.com/wix/Detox/pull/1007) ([reime005](https://github.com/reime005))
- List possible values for `type` [\#1003](https://github.com/wix/Detox/pull/1003) ([solkaz](https://github.com/solkaz))

## [v9.0.6](https://github.com/wix/Detox/tree/v9.0.6) (2018-11-02)
[Full Changelog](https://github.com/wix/Detox/compare/9.0.5...v9.0.6)

**Enhancements**

- add blacklistRegex to GREYConfiguration on init [\#1000](https://github.com/wix/Detox/pull/1000) ([quinlanj](https://github.com/quinlanj))
- append instead of clobber SIM\_CTL\_DYLD\_INSERT\_LIBRARIES [\#999](https://github.com/wix/Detox/pull/999) ([quinlanj](https://github.com/quinlanj))

**Closed Issues**

- Detox tests timeout on fresh project setup with Expo [\#1009](https://github.com/wix/Detox/issues/1009)
- RN57.3 - ReferenceError: device is not defined [\#1006](https://github.com/wix/Detox/issues/1006)
- Weird UI issues when running detox tests agains 0.57.x \(0.57.4 included\) [\#998](https://github.com/wix/Detox/issues/998)
- React native 0.57 [\#997](https://github.com/wix/Detox/issues/997)
- Yarn workspace module can [\#995](https://github.com/wix/Detox/issues/995)
- React Native Detox \(Android\) test fails while running detox test [\#970](https://github.com/wix/Detox/issues/970)
- device/element not found [\#969](https://github.com/wix/Detox/issues/969)
- Detox hangs on detox config step with expo iOS [\#917](https://github.com/wix/Detox/issues/917)
- Detox device/element is not defined [\#911](https://github.com/wix/Detox/issues/911)

**Merged Pull Requests**

- Fixed typo on GettingStarted page [\#990](https://github.com/wix/Detox/pull/990) ([pwfcurry](https://github.com/pwfcurry))
- Update mocking guide for RN \>= 0.57 [\#986](https://github.com/wix/Detox/pull/986) ([elyalvarado](https://github.com/elyalvarado))

## [9.0.5](https://github.com/wix/Detox/tree/9.0.5) (2018-10-24)
[Full Changelog](https://github.com/wix/Detox/compare/9.0.4...9.0.5)

**Enhancements**

- Support TouchID functionality [\#958](https://github.com/wix/Detox/issues/958)
- React Native latest version \(current 0.56\) support [\#821](https://github.com/wix/Detox/issues/821)
- Run tests with different locales on each run [\#683](https://github.com/wix/Detox/issues/683)
- Add more sync points to await action results before sending done messages [\#984](https://github.com/wix/Detox/pull/984) ([LeoNatan](https://github.com/LeoNatan))
- Implement the capability to change the language between tests [\#873](https://github.com/wix/Detox/pull/873) ([luisnaranjo733](https://github.com/luisnaranjo733))

**Fixed Bugs**

- iOS: Hybrid app with native first screen never reports that it's ready [\#933](https://github.com/wix/Detox/issues/933)
- hotfix: read unexpected EOF error message in logs [\#966](https://github.com/wix/Detox/pull/966) ([noomorph](https://github.com/noomorph))
- Fix post-install script when project lives on a path with spaces [\#965](https://github.com/wix/Detox/pull/965) ([bltavares](https://github.com/bltavares))
- Refine WXRNLoadIdlingResource to wait for JSDidLoad rather than ContentDidAppear [\#964](https://github.com/wix/Detox/pull/964) ([LeoNatan](https://github.com/LeoNatan))

**Closed Issues**

- Detox once initiate the app for every test suite though the suite is skipped or excluded  [\#987](https://github.com/wix/Detox/issues/987)
- postinstall fails [\#983](https://github.com/wix/Detox/issues/983)
- Android detox test fails -  ChildProcessError. [\#977](https://github.com/wix/Detox/issues/977)
- detox test failed [\#972](https://github.com/wix/Detox/issues/972)
- Running Detox on a real Android device - supported?  [\#968](https://github.com/wix/Detox/issues/968)
- How do I get Detox to quit after the first failure? [\#962](https://github.com/wix/Detox/issues/962)
- Globals are not resolved in Flow 0.81.0 [\#960](https://github.com/wix/Detox/issues/960)
- Android build is getting failed when tried to build with detox  [\#952](https://github.com/wix/Detox/issues/952)

**Merged Pull Requests**

- Reverted relative import of detox [\#994](https://github.com/wix/Detox/pull/994) ([pwfcurry](https://github.com/pwfcurry))
- Fixed invalid link [\#991](https://github.com/wix/Detox/pull/991) ([pwfcurry](https://github.com/pwfcurry))
- Fix publish website [\#989](https://github.com/wix/Detox/pull/989) ([yershalom](https://github.com/yershalom))
- docs: update info on how to update artifacts snapshots for e2e [\#973](https://github.com/wix/Detox/pull/973) ([noomorph](https://github.com/noomorph))
- Update APIRef.ActionsOnElement.md [\#967](https://github.com/wix/Detox/pull/967) ([osikes](https://github.com/osikes))
- Update the document for Expo [\#963](https://github.com/wix/Detox/pull/963) ([chansuke](https://github.com/chansuke))
- update build.gradle in demo-react-native [\#941](https://github.com/wix/Detox/pull/941) ([vonovak](https://github.com/vonovak))
- \[Android\] allow config extension [\#884](https://github.com/wix/Detox/pull/884) ([matteo-hertel](https://github.com/matteo-hertel))
- Move generation to babel 7 [\#762](https://github.com/wix/Detox/pull/762) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [9.0.4](https://github.com/wix/Detox/tree/9.0.4) (2018-09-28)
[Full Changelog](https://github.com/wix/Detox/compare/9.0.3...9.0.4)

**Fixed Bugs**

- Failed to load Info.plist from bundle at path [\#954](https://github.com/wix/Detox/issues/954)

**Closed Issues**

- Issue with the latest update of Xcode ? [\#949](https://github.com/wix/Detox/issues/949)

**Merged Pull Requests**

- hotfix: added a retry on install \(XCode 10 issue\) [\#953](https://github.com/wix/Detox/pull/953) ([noomorph](https://github.com/noomorph))

## [9.0.3](https://github.com/wix/Detox/tree/9.0.3) (2018-09-26)
[Full Changelog](https://github.com/wix/Detox/compare/9.0.2...9.0.3)

**Fixed Bugs**

- Regex for Android bundle id causing failures [\#924](https://github.com/wix/Detox/issues/924)

**Closed Issues**

- Specify device name? [\#948](https://github.com/wix/Detox/issues/948)
- Detox \<-\> React Native bridge [\#943](https://github.com/wix/Detox/issues/943)

**Merged Pull Requests**

- hotfix: legacy build workaround to fix monorepo build on XCode 10 [\#945](https://github.com/wix/Detox/pull/945) ([noomorph](https://github.com/noomorph))
- fix: ADB.pidof integration issue with grep and CRLF edge case [\#927](https://github.com/wix/Detox/pull/927) ([noomorph](https://github.com/noomorph))

## [9.0.2](https://github.com/wix/Detox/tree/9.0.2) (2018-09-24)
[Full Changelog](https://github.com/wix/Detox/compare/9.0.0...9.0.2)

**Enhancements**

- Documentation on using w/ React Native's officially sanctioned Expo tooling [\#236](https://github.com/wix/Detox/issues/236)

**Fixed Bugs**

- Unable to install Detox 8.2.3 using Xcode 10 beta 6 [\#913](https://github.com/wix/Detox/issues/913)
- Use legacy build system to build framework [\#940](https://github.com/wix/Detox/pull/940) ([karanjthakkar](https://github.com/karanjthakkar))

**Closed Issues**

- android:  DetoxRuntimeError: Failed to find PID of the launched bundle: com.tester [\#938](https://github.com/wix/Detox/issues/938)
- Option for suppressing views tree information [\#936](https://github.com/wix/Detox/issues/936)
- TabBarTestId is always a not found element [\#935](https://github.com/wix/Detox/issues/935)
- Task :detox:compileMinReactNative46DebugJavaWithJavac FAILED [\#919](https://github.com/wix/Detox/issues/919)
- Cannot find TextInput with secureTextEntry true in React-Native 0.55.4 [\#916](https://github.com/wix/Detox/issues/916)
- \[IOS\] Failing to execute tests in Bitrise for debug variant [\#819](https://github.com/wix/Detox/issues/819)

**Merged Pull Requests**

- Fix typo [\#928](https://github.com/wix/Detox/pull/928) ([tatane616](https://github.com/tatane616))
- \[Android\] Remove @override annotation to support RN 0.53-0.55 on detox 9.0 [\#922](https://github.com/wix/Detox/pull/922) ([JamesWatling](https://github.com/JamesWatling))

## [9.0.0](https://github.com/wix/Detox/tree/9.0.0) (2018-08-31)
[Full Changelog](https://github.com/wix/Detox/compare/9.0.1...9.0.0)

## [9.0.1](https://github.com/wix/Detox/tree/9.0.1) (2018-08-31)
[Full Changelog](https://github.com/wix/Detox/compare/8.2.3...9.0.1)

**Enhancements**

- Allow to disable touch indicators on IOS [\#640](https://github.com/wix/Detox/issues/640)

**Fixed Bugs**

- Multiple elements matched on action Swipe. [\#433](https://github.com/wix/Detox/issues/433)

**Merged Pull Requests**

- Android - Get rid of unnecessary reflection - Initial [\#915](https://github.com/wix/Detox/pull/915) ([rotemmiz](https://github.com/rotemmiz))
- Setup a script for Android demo projects in CI [\#914](https://github.com/wix/Detox/pull/914) ([rotemmiz](https://github.com/rotemmiz))
- RN 0.56.0 Android Support [\#910](https://github.com/wix/Detox/pull/910) ([rotemmiz](https://github.com/rotemmiz))
- Register Espresso IdlingResources with new API [\#909](https://github.com/wix/Detox/pull/909) ([rotemmiz](https://github.com/rotemmiz))
- Fix links in detox object docs [\#903](https://github.com/wix/Detox/pull/903) ([fvonhoven](https://github.com/fvonhoven))
- build\_framework.ios.sh: echo/exit from current shell [\#900](https://github.com/wix/Detox/pull/900) ([rye](https://github.com/rye))
- Add support for disabling touch indicators with launch args [\#899](https://github.com/wix/Detox/pull/899) ([haswalt](https://github.com/haswalt))

## [8.2.3](https://github.com/wix/Detox/tree/8.2.3) (2018-08-23)
[Full Changelog](https://github.com/wix/Detox/compare/8.2.2...8.2.3)

## [8.2.2](https://github.com/wix/Detox/tree/8.2.2) (2018-08-22)
[Full Changelog](https://github.com/wix/Detox/compare/8.2.1...8.2.2)

**Fixed Bugs**

- Nested ScrollView cause "Multiple UI elements match" [\#164](https://github.com/wix/Detox/issues/164)

**Merged Pull Requests**

- Fix multiple elements matched when dealing with nested scrollviews. [\#896](https://github.com/wix/Detox/pull/896) ([LeoNatan](https://github.com/LeoNatan))

## [8.2.1](https://github.com/wix/Detox/tree/8.2.1) (2018-08-22)
[Full Changelog](https://github.com/wix/Detox/compare/8.2.0...8.2.1)

## [8.2.0](https://github.com/wix/Detox/tree/8.2.0) (2018-08-22)
[Full Changelog](https://github.com/wix/Detox/compare/8.1.6...8.2.0)

**Fixed Bugs**

- postinstall script fails [\#889](https://github.com/wix/Detox/issues/889)
- Error when running "detox test" for windows using detox 8 due to findstr not supporting /s in regex [\#886](https://github.com/wix/Detox/issues/886)
- Log plugins in ArtifactsManager are not compatible with detox.init\(... launchApp: false ...\) option. [\#856](https://github.com/wix/Detox/issues/856)
- Default `detox test` triggers screenshot taking mechanism, to `dev/null`, it probably shouldn't trigger anything. [\#841](https://github.com/wix/Detox/issues/841)
- Where is the output for the UI Hierarchy? [\#737](https://github.com/wix/Detox/issues/737)

**Closed Issues**

- Postinstall script fails when just command line tools are installed [\#897](https://github.com/wix/Detox/issues/897)
- postinstall script fails when parent folder has a space in it [\#894](https://github.com/wix/Detox/issues/894)
- docs: takeScreenshot from tests? [\#892](https://github.com/wix/Detox/issues/892)
- Unable to find alert element  [\#890](https://github.com/wix/Detox/issues/890)

**Merged Pull Requests**

- Updated to EarlGrey 1.15.0 [\#895](https://github.com/wix/Detox/pull/895) ([rotemmiz](https://github.com/rotemmiz))
- Fix typo [\#891](https://github.com/wix/Detox/pull/891) ([kevinresol](https://github.com/kevinresol))
- fix\(win32\): new regexp for ADB.pid which is compatible with findstr utility [\#888](https://github.com/wix/Detox/pull/888) ([noomorph](https://github.com/noomorph))
- fix\(win32\): new regexp for adb.unlockScreen which is compatible with findstr [\#887](https://github.com/wix/Detox/pull/887) ([noomorph](https://github.com/noomorph))
- Internal changes to artifacts subsystem in Detox and bugfixes [\#848](https://github.com/wix/Detox/pull/848) ([noomorph](https://github.com/noomorph))

## [8.1.6](https://github.com/wix/Detox/tree/8.1.6) (2018-08-13)
[Full Changelog](https://github.com/wix/Detox/compare/8.1.5...8.1.6)

**Fixed Bugs**

- Detox catches SIGINT and SIGTERM, causing long running subprocesses to never end [\#881](https://github.com/wix/Detox/issues/881)

## [8.1.5](https://github.com/wix/Detox/tree/8.1.5) (2018-08-13)
[Full Changelog](https://github.com/wix/Detox/compare/8.1.4...8.1.5)

**Enhancements**

- Allow override of simulator name? [\#875](https://github.com/wix/Detox/issues/875)

**Closed Issues**

- CI: Switch Android emulator from google image to AOSP image [\#869](https://github.com/wix/Detox/issues/869)
- \[Docs\] Screenshot comparison tool recommendations [\#825](https://github.com/wix/Detox/issues/825)

**Merged Pull Requests**

- hotfix: remove SIGINT, SIGTERM handling due to \#881 [\#883](https://github.com/wix/Detox/pull/883) ([noomorph](https://github.com/noomorph))
- Add additional synchronization points for CFRunLoopPerformBlock [\#882](https://github.com/wix/Detox/pull/882) ([LeoNatan](https://github.com/LeoNatan))
- Add CLI parameter for overriding device name [\#878](https://github.com/wix/Detox/pull/878) ([robbiemccorkell](https://github.com/robbiemccorkell))

## [8.1.4](https://github.com/wix/Detox/tree/8.1.4) (2018-08-07)
[Full Changelog](https://github.com/wix/Detox/compare/8.1.3...8.1.4)

## [8.1.3](https://github.com/wix/Detox/tree/8.1.3) (2018-08-07)
[Full Changelog](https://github.com/wix/Detox/compare/8.1.2...8.1.3)

## [8.1.2](https://github.com/wix/Detox/tree/8.1.2) (2018-08-07)
[Full Changelog](https://github.com/wix/Detox/compare/8.1.1...8.1.2)

**Fixed Bugs**

- Detox should print video recorder errors to log on loglevel = info [\#865](https://github.com/wix/Detox/issues/865)

**Closed Issues**

- Strange issues in CI [\#864](https://github.com/wix/Detox/issues/864)
- SecurityError: localStorage is not available for opaque origins [\#863](https://github.com/wix/Detox/issues/863)
- Screen-wide taps? [\#849](https://github.com/wix/Detox/issues/849)

**Merged Pull Requests**

- change ES5 function to arrow function for consistency [\#874](https://github.com/wix/Detox/pull/874) ([vonovak](https://github.com/vonovak))
- iOS: Add RN Loading JS Idling Resource [\#872](https://github.com/wix/Detox/pull/872) ([LeoNatan](https://github.com/LeoNatan))
- Print detox PID in text logs [\#870](https://github.com/wix/Detox/pull/870) ([noomorph](https://github.com/noomorph))
- feat: cleaner implementation of ADB.unlockScreen [\#868](https://github.com/wix/Detox/pull/868) ([noomorph](https://github.com/noomorph))
- fix: stderr of the spawned process should be printed using log.error\(\) [\#867](https://github.com/wix/Detox/pull/867) ([noomorph](https://github.com/noomorph))
- Add .tbzignore and use it when creating the Detox source tbz [\#862](https://github.com/wix/Detox/pull/862) ([LeoNatan](https://github.com/LeoNatan))
- fix: cross-testrunner message formatting for DetoxRuntimeError [\#861](https://github.com/wix/Detox/pull/861) ([noomorph](https://github.com/noomorph))
- Add Android back button \(copy of PR\#505\) [\#860](https://github.com/wix/Detox/pull/860) ([noomorph](https://github.com/noomorph))
- Make doc generation more robust [\#783](https://github.com/wix/Detox/pull/783) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [8.1.1](https://github.com/wix/Detox/tree/8.1.1) (2018-07-26)
[Full Changelog](https://github.com/wix/Detox/compare/8.1.0...8.1.1)

**Merged Pull Requests**

- hotfix: revert log level debug to verbose due to Mocha incompatibility [\#859](https://github.com/wix/Detox/pull/859) ([noomorph](https://github.com/noomorph))

## [8.1.0](https://github.com/wix/Detox/tree/8.1.0) (2018-07-26)
[Full Changelog](https://github.com/wix/Detox/compare/8.0.0...8.1.0)

**Enhancements**

- Logo proposal [\#738](https://github.com/wix/Detox/issues/738)
- After run detox test getting Device.js Unexpected token ... [\#663](https://github.com/wix/Detox/issues/663)
- Streamline Xcode Debug [\#556](https://github.com/wix/Detox/issues/556)
- Add support for test artifacts \(videos and screenshots\) [\#171](https://github.com/wix/Detox/issues/171)
- New logger subsystem \(Bunyan\) [\#835](https://github.com/wix/Detox/pull/835) ([noomorph](https://github.com/noomorph))

**Fixed Bugs**

- Documentation for Parallel Workers [\#787](https://github.com/wix/Detox/issues/787)

**Closed Issues**

- Detox test command failed [\#855](https://github.com/wix/Detox/issues/855)
- build failes on CI \(app center\) with ` fatal error: 'Firebase.h' file not found` [\#838](https://github.com/wix/Detox/issues/838)
- detox build failes with "ld: library not found for -lDoubleConversion" [\#837](https://github.com/wix/Detox/issues/837)
- tvOS Support in Detox [\#836](https://github.com/wix/Detox/issues/836)
- Should have functionality of pressing device back button [\#833](https://github.com/wix/Detox/issues/833)
- ADB.pidof\(deviceId, bundleId\) does not work consistently across Android versions [\#831](https://github.com/wix/Detox/issues/831)
- Detox not interacting with simulator  [\#823](https://github.com/wix/Detox/issues/823)
- Cannot launch app on Android \(instrumentationProcess terminated due to receipt of signal SIGTERM\) [\#822](https://github.com/wix/Detox/issues/822)
- Detox tests run so slow that element.tap\(\) interpreted as a longPress\(\) [\#818](https://github.com/wix/Detox/issues/818)
- Detox test failing: cannot hook the emulator [\#817](https://github.com/wix/Detox/issues/817)
- Installing detox nukes new React Native project [\#816](https://github.com/wix/Detox/issues/816)
- Detox test run with artifacts flag '--record-videos failing' succeeds locally, fails on build server [\#814](https://github.com/wix/Detox/issues/814)
- Detox hangs on device.init\(\) for IOS tests [\#804](https://github.com/wix/Detox/issues/804)
- Control the sequence of test files [\#801](https://github.com/wix/Detox/issues/801)
- Last detox cli [\#800](https://github.com/wix/Detox/issues/800)
- detox test fail on android [\#799](https://github.com/wix/Detox/issues/799)
- element.typeText\(\) will fail test when hardware keyboard connected [\#768](https://github.com/wix/Detox/issues/768)
- Detox should allow us to set configuration outside package.json [\#758](https://github.com/wix/Detox/issues/758)
- Device farming services issue. Need to test the app on multiple android and IOS devices. [\#750](https://github.com/wix/Detox/issues/750)

**Merged Pull Requests**

- fix: adds grep fallback for win32 [\#858](https://github.com/wix/Detox/pull/858) ([noomorph](https://github.com/noomorph))
- Printing environment variables before `jest` test command [\#852](https://github.com/wix/Detox/pull/852) ([noomorph](https://github.com/noomorph))
- Add region to s3 upload [\#847](https://github.com/wix/Detox/pull/847) ([yershalom](https://github.com/yershalom))
- Replace ":" with "-" in generated artifacts directories for better filesystem compatibility \(on Win and Mac\) [\#846](https://github.com/wix/Detox/pull/846) ([noomorph](https://github.com/noomorph))
- Make detox.init\(\) stricter - should log error as soon as it happens [\#840](https://github.com/wix/Detox/pull/840) ([noomorph](https://github.com/noomorph))
- Resolves \#831 [\#839](https://github.com/wix/Detox/pull/839) ([noomorph](https://github.com/noomorph))
- Allow execution of post-install scripts on paths with space [\#824](https://github.com/wix/Detox/pull/824) ([bltavares](https://github.com/bltavares))
- Bump Lodash dependency to ^4.17.5 [\#812](https://github.com/wix/Detox/pull/812) ([noomorph](https://github.com/noomorph))
- Prevent bugs with older \_.isFunction prior to lodash@4.14.1 [\#811](https://github.com/wix/Detox/pull/811) ([noomorph](https://github.com/noomorph))
- Improve dispatch queue idling resource handling [\#806](https://github.com/wix/Detox/pull/806) ([LeoNatan](https://github.com/LeoNatan))
- \[+coverage\] unit tests for ArtifactsManager.js and ArtifactPlugin.js [\#794](https://github.com/wix/Detox/pull/794) ([noomorph](https://github.com/noomorph))
- Fix  detox cli --platform flag on Windows [\#763](https://github.com/wix/Detox/pull/763) ([simonbuchan](https://github.com/simonbuchan))

## [8.0.0](https://github.com/wix/Detox/tree/8.0.0) (2018-06-27)
[Full Changelog](https://github.com/wix/Detox/compare/v8.0.0-alpha.1...8.0.0)

**Enhancements**

- Add detox definitions [\#99](https://github.com/wix/Detox/issues/99)

**Fixed Bugs**

- The contributing guide is out of date [\#576](https://github.com/wix/Detox/issues/576)

**Closed Issues**

- Fix atIndex order on IOS [\#792](https://github.com/wix/Detox/issues/792)
- Detox timed out after run test [\#790](https://github.com/wix/Detox/issues/790)
- Detox 7.3.3 crashes when using bundle url [\#673](https://github.com/wix/Detox/issues/673)

**Merged Pull Requests**

- Update APIRef.TestLifecycle.md [\#797](https://github.com/wix/Detox/pull/797) ([lalka-workco](https://github.com/lalka-workco))
- Stack traces for failures now include caller's test code [\#786](https://github.com/wix/Detox/pull/786) ([mikelovesrobots](https://github.com/mikelovesrobots))
- Screenshots, logs and video recordings of tests  [\#734](https://github.com/wix/Detox/pull/734) ([noomorph](https://github.com/noomorph))
- Usage with Expo instructions [\#630](https://github.com/wix/Detox/pull/630) ([peterpme](https://github.com/peterpme))

## [v8.0.0-alpha.1](https://github.com/wix/Detox/tree/v8.0.0-alpha.1) (2018-06-18)
[Full Changelog](https://github.com/wix/Detox/compare/v8.0.0-alpha.0...v8.0.0-alpha.1)

## [v8.0.0-alpha.0](https://github.com/wix/Detox/tree/v8.0.0-alpha.0) (2018-06-14)
[Full Changelog](https://github.com/wix/Detox/compare/7.4.3...v8.0.0-alpha.0)

## [7.4.3](https://github.com/wix/Detox/tree/7.4.3) (2018-06-14)
[Full Changelog](https://github.com/wix/Detox/compare/7.4.2...7.4.3)

**Closed Issues**

- Move Android Matchers to generated code [\#725](https://github.com/wix/Detox/issues/725)

**Merged Pull Requests**

- Android: on headless mode, default to high-perf software renderes `swiftshader\_indirect` and `angle\_indirect` [\#784](https://github.com/wix/Detox/pull/784) ([rotemmiz](https://github.com/rotemmiz))
- be explicit about supported RN versions [\#773](https://github.com/wix/Detox/pull/773) ([vonovak](https://github.com/vonovak))
- Move android matchers to generated code [\#745](https://github.com/wix/Detox/pull/745) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [7.4.2](https://github.com/wix/Detox/tree/7.4.2) (2018-06-10)
[Full Changelog](https://github.com/wix/Detox/compare/7.4.1...7.4.2)

## [7.4.1](https://github.com/wix/Detox/tree/7.4.1) (2018-06-10)
[Full Changelog](https://github.com/wix/Detox/compare/7.4.0...7.4.1)

**Fixed Bugs**

- error in  clearDeviceRegistryLockFile\(\) when running detox test [\#771](https://github.com/wix/Detox/issues/771)
- Android: force matchers to ignore layouts with GONE visibility [\#761](https://github.com/wix/Detox/issues/761)

**Closed Issues**

- Can we run detox on Ubuntu 16.04.4? [\#770](https://github.com/wix/Detox/issues/770)

**Merged Pull Requests**

- Android: Force emulator launch to use `-gpu host` instead of `-gpu auto` on macOS [\#782](https://github.com/wix/Detox/pull/782) ([rotemmiz](https://github.com/rotemmiz))
- Ensure device.registry.state.lock path exists before clearing it [\#781](https://github.com/wix/Detox/pull/781) ([rotemmiz](https://github.com/rotemmiz))
- Match only visible views [\#780](https://github.com/wix/Detox/pull/780) ([rotemmiz](https://github.com/rotemmiz))
- Fix typo on ActionsOnElement docs [\#776](https://github.com/wix/Detox/pull/776) ([smrpr](https://github.com/smrpr))
- Android: force matchers to ignore layouts with GONE visibility [\#775](https://github.com/wix/Detox/pull/775) ([rotemmiz](https://github.com/rotemmiz))

## [7.4.0](https://github.com/wix/Detox/tree/7.4.0) (2018-06-03)
[Full Changelog](https://github.com/wix/Detox/compare/7.3.7...7.4.0)

**Enhancements**

- Parallel Simulator support [\#97](https://github.com/wix/Detox/issues/97)
- Support parallel test execution [\#609](https://github.com/wix/Detox/pull/609) ([doronpr](https://github.com/doronpr))

**Fixed Bugs**

- Detox overrides React Native Navigation statusBarHidden [\#741](https://github.com/wix/Detox/issues/741)

**Closed Issues**

- Website publishing is not stable [\#765](https://github.com/wix/Detox/issues/765)
- Unusual gradle error while running e2e tests in detox/test directory.  [\#759](https://github.com/wix/Detox/issues/759)
- Where to locate these settings [\#747](https://github.com/wix/Detox/issues/747)
- iOS Permission - HealthKit [\#736](https://github.com/wix/Detox/issues/736)
- Move Android Driver to generated code [\#724](https://github.com/wix/Detox/issues/724)
- Move IOS Driver to generated code [\#719](https://github.com/wix/Detox/issues/719)
- Detox hangs on circleci [\#717](https://github.com/wix/Detox/issues/717)
- Explore usage of javaparser for Java code generation [\#692](https://github.com/wix/Detox/issues/692)

**Merged Pull Requests**

- Fix website deploy [\#766](https://github.com/wix/Detox/pull/766) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Update APIRef.DeviceObjectAPI.md [\#760](https://github.com/wix/Detox/pull/760) ([mbardauskas](https://github.com/mbardauskas))
- Android Driver to generated code [\#743](https://github.com/wix/Detox/pull/743) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Fix logger and add run\_f for all ci steps [\#729](https://github.com/wix/Detox/pull/729) ([yershalom](https://github.com/yershalom))
- Move iOS Device rotation to generated code [\#727](https://github.com/wix/Detox/pull/727) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Bump requirements to Node 8.x and activate minimal eslint configuration [\#722](https://github.com/wix/Detox/pull/722) ([noomorph](https://github.com/noomorph))
- Update Android emulator path to support SDK Tools \>=25.3.0 [\#700](https://github.com/wix/Detox/pull/700) ([elyalvarado](https://github.com/elyalvarado))
- Add check for ungenerated code [\#679](https://github.com/wix/Detox/pull/679) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Running on windows support [\#628](https://github.com/wix/Detox/pull/628) ([simonbuchan](https://github.com/simonbuchan))

## [7.3.7](https://github.com/wix/Detox/tree/7.3.7) (2018-05-10)
[Full Changelog](https://github.com/wix/Detox/compare/7.3.6...7.3.7)

**Closed Issues**

- Detox and react-native-maps [\#718](https://github.com/wix/Detox/issues/718)

## [7.3.6](https://github.com/wix/Detox/tree/7.3.6) (2018-05-09)
[Full Changelog](https://github.com/wix/Detox/compare/7.3.5...7.3.6)

**Enhancements**

- Support long press duration for element [\#410](https://github.com/wix/Detox/issues/410)
- Add support for picker views \(UIPickerView, UIDatePicker\) [\#308](https://github.com/wix/Detox/issues/308)
- Fix build in CI - create a build matrix [\#296](https://github.com/wix/Detox/issues/296)
- Be able to check if element is tappable/clickable [\#246](https://github.com/wix/Detox/issues/246)
- Snapshot Testing [\#170](https://github.com/wix/Detox/issues/170)
- Match by selector [\#42](https://github.com/wix/Detox/issues/42)

**Fixed Bugs**

- detox test crash w/ Signal 6 in release mode [\#704](https://github.com/wix/Detox/issues/704)
- Detox failed to start testing in my react native project [\#548](https://github.com/wix/Detox/issues/548)

**Closed Issues**

- Possible to specify Scroll start location? [\#715](https://github.com/wix/Detox/issues/715)
- Can't launch android simulator [\#714](https://github.com/wix/Detox/issues/714)
- Detox Port [\#694](https://github.com/wix/Detox/issues/694)
- Command failed: /usr/bin/xcrun simctl shutdown [\#671](https://github.com/wix/Detox/issues/671)
- 'element is not defined' when running detox in CI [\#670](https://github.com/wix/Detox/issues/670)
- Allow setting permissions outside of `launchApp\(\)` [\#392](https://github.com/wix/Detox/issues/392)
- Type text to currently focused input [\#210](https://github.com/wix/Detox/issues/210)

**Merged Pull Requests**

- Emulator wrapper fixes  [\#702](https://github.com/wix/Detox/pull/702) ([noomorph](https://github.com/noomorph))
- Move GREYConfiguration to generated code [\#693](https://github.com/wix/Detox/pull/693) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Website: fix version display [\#582](https://github.com/wix/Detox/pull/582) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Add duration of element.longPress for iOS [\#412](https://github.com/wix/Detox/pull/412) ([jhen0409](https://github.com/jhen0409))

## [7.3.5](https://github.com/wix/Detox/tree/7.3.5) (2018-05-01)
[Full Changelog](https://github.com/wix/Detox/compare/7.3.4...7.3.5)

**Closed Issues**

- Run tests with different languages [\#703](https://github.com/wix/Detox/issues/703)
- Please include expo app setup in Introduction.GettingStarted.md [\#698](https://github.com/wix/Detox/issues/698)
- Missing package name and version [\#696](https://github.com/wix/Detox/issues/696)
- \[iOS\] when .tap\(\) in test, device.reloadReactNative\(\) stalls indefinitely [\#691](https://github.com/wix/Detox/issues/691)
- NS\_REFINED\_FOR\_SWIFT should be ignored by generated code [\#682](https://github.com/wix/Detox/issues/682)

**Merged Pull Requests**

- Migrate from Travis CI to Jenkins [\#701](https://github.com/wix/Detox/pull/701) ([yershalom](https://github.com/yershalom))
- Add no window option for running android emulator with no window [\#690](https://github.com/wix/Detox/pull/690) ([yershalom](https://github.com/yershalom))

## [7.3.4](https://github.com/wix/Detox/tree/7.3.4) (2018-04-25)
[Full Changelog](https://github.com/wix/Detox/compare/7.3.3...7.3.4)

**Fixed Bugs**

- \[iOS\] Tests stall in detox.init, error: \[SRWebSocket sendString:error:\]: unrecognized selector sent to instance [\#689](https://github.com/wix/Detox/issues/689)
- Detox Android incompatible with RN \>= 50 [\#608](https://github.com/wix/Detox/issues/608)

**Closed Issues**

- detox api to select photo from photo library ios 11 [\#676](https://github.com/wix/Detox/issues/676)
- Add support for conditional logic around elements [\#672](https://github.com/wix/Detox/issues/672)
- TextInput label/id not getting picked up in detox [\#667](https://github.com/wix/Detox/issues/667)

**Merged Pull Requests**

- Unit tests: Ignore .test.js and .mock.js  [\#686](https://github.com/wix/Detox/pull/686) ([yershalom](https://github.com/yershalom))
- docs: fix missing article name in table of contents [\#685](https://github.com/wix/Detox/pull/685) ([noomorph](https://github.com/noomorph))
- Update objective-c-parser [\#684](https://github.com/wix/Detox/pull/684) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- \[Android\] Ensure main thread when doing getInstanceManager [\#681](https://github.com/wix/Detox/pull/681) ([wiyarmir](https://github.com/wiyarmir))
- \[Android\] Enable usage of custom instrumentation test runners [\#675](https://github.com/wix/Detox/pull/675) ([wiyarmir](https://github.com/wiyarmir))
- Avoid NPE when DetoxServerUrl and DetoxSessionId are not set [\#666](https://github.com/wix/Detox/pull/666) ([wiyarmir](https://github.com/wiyarmir))
- Change 'deugging' to 'debugging' in TroubleShooting\#RunningTests docs [\#662](https://github.com/wix/Detox/pull/662) ([johnbayne](https://github.com/johnbayne))
- Add generation for GREYInteraction [\#564](https://github.com/wix/Detox/pull/564) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [7.3.3](https://github.com/wix/Detox/tree/7.3.3) (2018-04-04)
[Full Changelog](https://github.com/wix/Detox/compare/7.3.2...7.3.3)

**Fixed Bugs**

- Android: Running instrumentation requires ADB to be in path [\#651](https://github.com/wix/Detox/issues/651)
- CLI: `detox test` fails to determine a default configuration [\#648](https://github.com/wix/Detox/issues/648)
- Android: Support RN50-51 changes [\#652](https://github.com/wix/Detox/pull/652) ([rotemmiz](https://github.com/rotemmiz))

**Closed Issues**

- My app close immediately when run detox test. [\#657](https://github.com/wix/Detox/issues/657)
- device.launchApp won't give notification permissions on 7.3.2 [\#653](https://github.com/wix/Detox/issues/653)
- Test failing when launching on Android emulator with "before all" hook error [\#647](https://github.com/wix/Detox/issues/647)

**Merged Pull Requests**

- Fix broken link to DTXMethodInvocation.m in docs [\#659](https://github.com/wix/Detox/pull/659) ([karanjthakkar](https://github.com/karanjthakkar))
- Add info about Android RN \>= 0.50 incompatibility. [\#654](https://github.com/wix/Detox/pull/654) ([ohwillie](https://github.com/ohwillie))
- Update ISSUE\_TEMPLATE.md [\#649](https://github.com/wix/Detox/pull/649) ([vonovak](https://github.com/vonovak))
- docs: Fix broken link to detox permission tests [\#646](https://github.com/wix/Detox/pull/646) ([askielboe](https://github.com/askielboe))

## [7.3.2](https://github.com/wix/Detox/tree/7.3.2) (2018-03-27)
[Full Changelog](https://github.com/wix/Detox/compare/7.3.0...7.3.2)

**Closed Issues**

- test issue with no labels [\#642](https://github.com/wix/Detox/issues/642)
- Timeout exceeded on Travis CI [\#579](https://github.com/wix/Detox/issues/579)
- When running Android with Expo - ReactInstanceManager is null [\#578](https://github.com/wix/Detox/issues/578)

## [7.3.0](https://github.com/wix/Detox/tree/7.3.0) (2018-03-26)
[Full Changelog](https://github.com/wix/Detox/compare/7.2.0...7.3.0)

**Enhancements**

- Support UserActivity [\#622](https://github.com/wix/Detox/issues/622)
- Add Support for Device Shake Action [\#551](https://github.com/wix/Detox/issues/551)
- Add prod/dev awareness to scripts building Detox.framework for easier native development process [\#621](https://github.com/wix/Detox/pull/621) ([LeoNatan](https://github.com/LeoNatan))

**Fixed Bugs**

- detox clean-framework-cache && detox build-framework-cache broken for internal development [\#619](https://github.com/wix/Detox/issues/619)
- detox.init doesn't resolve in hybrid apps with initial native page \(until you manually navigate to a react native page\) [\#615](https://github.com/wix/Detox/issues/615)
- `createPushNotificationJson` creates a notification.json file under a constant path [\#601](https://github.com/wix/Detox/issues/601)

**Closed Issues**

- android detox issue with jest + emulator  [\#624](https://github.com/wix/Detox/issues/624)
- Android tap action fails silently [\#620](https://github.com/wix/Detox/issues/620)
- Error: app-debug-androidTest.apk could not be found, did you run './gradlew assembleAndroidTest' ? [\#613](https://github.com/wix/Detox/issues/613)
- Add detox preStart script in config json [\#60](https://github.com/wix/Detox/issues/60)

**Merged Pull Requests**

- CLI: Automatically filter platform tests by inferring from config [\#639](https://github.com/wix/Detox/pull/639) ([rotemmiz](https://github.com/rotemmiz))
- Update Introduction.Workflows.md [\#633](https://github.com/wix/Detox/pull/633) ([joegoodall1](https://github.com/joegoodall1))
- Compile Detox test project from RN sources [\#632](https://github.com/wix/Detox/pull/632) ([rotemmiz](https://github.com/rotemmiz))
- iOS: Support spaces in app name [\#626](https://github.com/wix/Detox/pull/626) ([ssg-luke](https://github.com/ssg-luke))
- CLI: Fixed typo in subcommand description [\#625](https://github.com/wix/Detox/pull/625) ([vonovak](https://github.com/vonovak))
- iOS: Add support for userActivity API [\#623](https://github.com/wix/Detox/pull/623) ([LeoNatan](https://github.com/LeoNatan))
- CLI: add -f option to run specific test file [\#616](https://github.com/wix/Detox/pull/616) ([jeremyeaton89](https://github.com/jeremyeaton89))
- iOS: perform actions on UIPickerView [\#605](https://github.com/wix/Detox/pull/605) ([DmitryPonomarenko](https://github.com/DmitryPonomarenko))

## [7.2.0](https://github.com/wix/Detox/tree/7.2.0) (2018-03-12)
[Full Changelog](https://github.com/wix/Detox/compare/7.1.0...7.2.0)

**Enhancements**

- Generate JSDoc comments for generated code [\#521](https://github.com/wix/Detox/issues/521)
- Add point to point panning API [\#154](https://github.com/wix/Detox/issues/154)
- Switch from Mocha to another lib  [\#94](https://github.com/wix/Detox/issues/94)
- Clean up after build\_framework [\#577](https://github.com/wix/Detox/pull/577) ([MatthieuLemoine](https://github.com/MatthieuLemoine))

**Fixed Bugs**

- Husky hooks bugged out when attempting a commit [\#606](https://github.com/wix/Detox/issues/606)
- Starting application from background with notification happens in foreground \(iOS\) [\#590](https://github.com/wix/Detox/issues/590)
- Find element by text doesn't function with minimal project on latest version of RN and detox [\#572](https://github.com/wix/Detox/issues/572)
- reason for test failure stopped being reported [\#5](https://github.com/wix/Detox/issues/5)

**Closed Issues**

- detox test ios with error:  Timeout of 120000ms exceeded [\#602](https://github.com/wix/Detox/issues/602)
- No such file or directory config.ini [\#574](https://github.com/wix/Detox/issues/574)
- tandalone `Standalone `detox-cli` npm package hasn't been updated to address issues with spaces in directories. [\#573](https://github.com/wix/Detox/issues/573)
- Detox is flaky on Travis CI [\#452](https://github.com/wix/Detox/issues/452)
- Swipe Action Doesn't Work on RN ListView? [\#103](https://github.com/wix/Detox/issues/103)

**Merged Pull Requests**

- RN Update Script v1.1 [\#610](https://github.com/wix/Detox/pull/610) ([rotemmiz](https://github.com/rotemmiz))
- iOS: Improve notifications dispatch timing [\#604](https://github.com/wix/Detox/pull/604) ([LeoNatan](https://github.com/LeoNatan))
- Kill Android instrumentation and nullify the object when it crashes [\#603](https://github.com/wix/Detox/pull/603) ([rotemmiz](https://github.com/rotemmiz))
- Update Introduction.Android.md [\#596](https://github.com/wix/Detox/pull/596) ([joegoodall1](https://github.com/joegoodall1))
- Better support for multiple RN version in test project + updated example projects [\#591](https://github.com/wix/Detox/pull/591) ([rotemmiz](https://github.com/rotemmiz))
- Update Example .travis.yml in CI Guide [\#586](https://github.com/wix/Detox/pull/586) ([mtmckenna](https://github.com/mtmckenna))
- Use travis branch to determine master [\#580](https://github.com/wix/Detox/pull/580) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Docs: Use jest.setTimeout instead of jasmine timeout [\#562](https://github.com/wix/Detox/pull/562) ([thymikee](https://github.com/thymikee))
- Add Support for ShakeDevice Action [\#559](https://github.com/wix/Detox/pull/559) ([LeoNatan](https://github.com/LeoNatan))
- Support testApk path for gradle builds with multiple flavor matrix [\#554](https://github.com/wix/Detox/pull/554) ([sdg9](https://github.com/sdg9))
- set location should not use comma [\#532](https://github.com/wix/Detox/pull/532) ([hiaw](https://github.com/hiaw))
- Generation: combining and string matchers for android [\#496](https://github.com/wix/Detox/pull/496) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [7.1.0](https://github.com/wix/Detox/tree/7.1.0) (2018-02-12)
[Full Changelog](https://github.com/wix/Detox/compare/7.0.1...7.1.0)

**Enhancements**

- Fix doc generation to only run from master [\#542](https://github.com/wix/Detox/issues/542)
- export globals [\#275](https://github.com/wix/Detox/issues/275)
- Look for a way to catch app crashes and report to the user, rather than have test stuck until timeout [\#161](https://github.com/wix/Detox/issues/161)
- Android Support [\#96](https://github.com/wix/Detox/issues/96)
- Add exception and signal handling for iOS [\#453](https://github.com/wix/Detox/pull/453) ([LeoNatan](https://github.com/LeoNatan))

**Fixed Bugs**

- openURL API is broken [\#561](https://github.com/wix/Detox/issues/561)

**Closed Issues**

- Query : Can we handle out of app actions using detox. [\#553](https://github.com/wix/Detox/issues/553)
- How to disable the error log in console when the testcase is failed on Android [\#550](https://github.com/wix/Detox/issues/550)
- flakiness casued by atIndex [\#549](https://github.com/wix/Detox/issues/549)
- Ionic compatibility [\#547](https://github.com/wix/Detox/issues/547)
- Modifying NODE\_ENV through mocha.opts doesn't work [\#535](https://github.com/wix/Detox/issues/535)
- Accessing launchArgs in Android [\#530](https://github.com/wix/Detox/issues/530)
- Enhancement: Scroll until visible [\#520](https://github.com/wix/Detox/issues/520)
- Can't find device on React Native Demo Project [\#467](https://github.com/wix/Detox/issues/467)

**Merged Pull Requests**

- Minor typo in Introduction.GettingStarted.md [\#555](https://github.com/wix/Detox/pull/555) ([orta](https://github.com/orta))
- Website build only run on master [\#544](https://github.com/wix/Detox/pull/544) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [7.0.1](https://github.com/wix/Detox/tree/7.0.1) (2018-01-29)
[Full Changelog](https://github.com/wix/Detox/compare/7.0.0...7.0.1)

**Closed Issues**

- Device clouds? [\#543](https://github.com/wix/Detox/issues/543)

**Merged Pull Requests**

- Fixes broken AndroidDriver explicit exportGlobals flow [\#545](https://github.com/wix/Detox/pull/545) ([rotemmiz](https://github.com/rotemmiz))

## [7.0.0](https://github.com/wix/Detox/tree/7.0.0) (2018-01-26)
[Full Changelog](https://github.com/wix/Detox/compare/v7.0.0-alpha.1...7.0.0)

**Closed Issues**

- Detox supports running tests in parallel iOS ? [\#525](https://github.com/wix/Detox/issues/525)

**Merged Pull Requests**

- export platform specific objects through proxy [\#374](https://github.com/wix/Detox/pull/374) ([trofima](https://github.com/trofima))

## [v7.0.0-alpha.1](https://github.com/wix/Detox/tree/v7.0.0-alpha.1) (2018-01-24)
[Full Changelog](https://github.com/wix/Detox/compare/v7.0.0-alpha.0...v7.0.0-alpha.1)

**Fixed Bugs**

- Android test apk build path not aligned when using flavors [\#522](https://github.com/wix/Detox/issues/522)

**Closed Issues**

- detox-cli on fails to run on windows with nvm [\#509](https://github.com/wix/Detox/issues/509)

**Merged Pull Requests**

- Fixed section link in doc [\#539](https://github.com/wix/Detox/pull/539) ([Brianwebb22](https://github.com/Brianwebb22))
- Fixes \#522: Android test apk path is now aligned with build flavors [\#537](https://github.com/wix/Detox/pull/537) ([rotemmiz](https://github.com/rotemmiz))
- Correct grammar in docs [\#533](https://github.com/wix/Detox/pull/533) ([tharax](https://github.com/tharax))
- Fix homepage in detox & detox-server package.json [\#531](https://github.com/wix/Detox/pull/531) ([hectahertz](https://github.com/hectahertz))
- Update docs to fix hyperlink [\#519](https://github.com/wix/Detox/pull/519) ([tharax](https://github.com/tharax))
- Fix wrong path to install Android script [\#514](https://github.com/wix/Detox/pull/514) ([ygorbarboza](https://github.com/ygorbarboza))
- Add docusaurus for website [\#491](https://github.com/wix/Detox/pull/491) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [v7.0.0-alpha.0](https://github.com/wix/Detox/tree/v7.0.0-alpha.0) (2018-01-11)
[Full Changelog](https://github.com/wix/Detox/compare/6.0.4...v7.0.0-alpha.0)

**Enhancements**

- Add automatic code formatting via prettier [\#223](https://github.com/wix/Detox/issues/223)

**Fixed Bugs**

- atIndex\(\) seems to be broken on Android [\#498](https://github.com/wix/Detox/issues/498)
- Getting Started also requires adding babel-polyfill [\#481](https://github.com/wix/Detox/issues/481)
- Test release on Android: app-release-androidTest.apk: No such file or directory [\#455](https://github.com/wix/Detox/issues/455)
- Both Android and iOS e2e tests fail when following contribution guide [\#369](https://github.com/wix/Detox/issues/369)
- Problems on Android using Jest test runner [\#362](https://github.com/wix/Detox/issues/362)
- Detox failed to install apk files [\#274](https://github.com/wix/Detox/issues/274)

**Closed Issues**

- detox test fails to run on windows with jest [\#510](https://github.com/wix/Detox/issues/510)
- invalid top level package.json file and pre-release/beta release request [\#501](https://github.com/wix/Detox/issues/501)
- Can u add a feature to return values from Detox in an array [\#489](https://github.com/wix/Detox/issues/489)
- Tap Nth row of FlatList/ScrollView/ListView, where each row is touchable [\#485](https://github.com/wix/Detox/issues/485)
- Support Web Testing - React Native Web [\#482](https://github.com/wix/Detox/issues/482)
- \[Feature request\] Get current UI name and/or hanlder [\#473](https://github.com/wix/Detox/issues/473)
- Ubuntu  16.04.3, can't build debug apk for emulator [\#472](https://github.com/wix/Detox/issues/472)
- Detox flakiness while testing on Circle CI [\#471](https://github.com/wix/Detox/issues/471)
- Scrollview with multiple element matched [\#462](https://github.com/wix/Detox/issues/462)
- App is launched by Detox and almost immediately crashes  [\#459](https://github.com/wix/Detox/issues/459)

**Merged Pull Requests**

- Added support for emulators \<= API lvl 23 [\#506](https://github.com/wix/Detox/pull/506) ([simonracz](https://github.com/simonracz))
- Fixed atIndex\(0\) for Android. [\#504](https://github.com/wix/Detox/pull/504) ([simonracz](https://github.com/simonracz))
- Mention running on iOS device is not yet supported [\#499](https://github.com/wix/Detox/pull/499) ([fdnhkj](https://github.com/fdnhkj))
- Update AndroidDriver.js [\#497](https://github.com/wix/Detox/pull/497) ([Crash--](https://github.com/Crash--))
- Fix error message to not state false information [\#495](https://github.com/wix/Detox/pull/495) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Add quotes around xcode version output [\#493](https://github.com/wix/Detox/pull/493) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Generation: Add Android Matchers to generated code [\#492](https://github.com/wix/Detox/pull/492) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Remove excessive curly bracket [\#490](https://github.com/wix/Detox/pull/490) ([dluksza](https://github.com/dluksza))
- Generation: Move DetoxAction invocations to generated code [\#479](https://github.com/wix/Detox/pull/479) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Fix typo in docs/Troubleshooting.RunningTests.md [\#475](https://github.com/wix/Detox/pull/475) ([douglasnomizo](https://github.com/douglasnomizo))
- FIxed broken setURLBlacklist on Android [\#474](https://github.com/wix/Detox/pull/474) ([rotemmiz](https://github.com/rotemmiz))
- \[BREAKING\] Upgrade to gradle 4.1 and android gradle plugin 3 [\#468](https://github.com/wix/Detox/pull/468) ([rotemmiz](https://github.com/rotemmiz))
- Generation: Add generation for external files [\#465](https://github.com/wix/Detox/pull/465) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Fix the link to Android Support Status page [\#461](https://github.com/wix/Detox/pull/461) ([kkhaidukov](https://github.com/kkhaidukov))

## [6.0.4](https://github.com/wix/Detox/tree/6.0.4) (2017-12-13)
[Full Changelog](https://github.com/wix/Detox/compare/6.0.2...6.0.4)

**Enhancements**

- Add support for jest as a test runner [\#242](https://github.com/wix/Detox/issues/242)
- Sync Issues if Native Modules with Network connection are used [\#146](https://github.com/wix/Detox/issues/146)
- Use new logging infra for Detox logging [\#457](https://github.com/wix/Detox/pull/457) ([LeoNatan](https://github.com/LeoNatan))

**Fixed Bugs**

- Idling resource pretty print does not actually print tracked objects [\#456](https://github.com/wix/Detox/issues/456)
- Build Framework script not able to unarchive Detox-ios-src.tbz [\#438](https://github.com/wix/Detox/issues/438)
- Detox is broken due to detox-server version 6.0.0 not released [\#437](https://github.com/wix/Detox/issues/437)

**Closed Issues**

- Detox support for tap and drag functionality? [\#451](https://github.com/wix/Detox/issues/451)
- Does not launch ios simulator automatically on the Xcode 9.1 [\#450](https://github.com/wix/Detox/issues/450)

**Merged Pull Requests**

- Add generation for tap at location [\#449](https://github.com/wix/Detox/pull/449) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Generation: Remove unused helpers from generated code [\#448](https://github.com/wix/Detox/pull/448) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Add prettier formatting for code generation [\#446](https://github.com/wix/Detox/pull/446) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Fix several spelling typos [\#442](https://github.com/wix/Detox/pull/442) ([sdg9](https://github.com/sdg9))
- Add support for generating android matchers [\#425](https://github.com/wix/Detox/pull/425) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Add prettier to detox folder [\#278](https://github.com/wix/Detox/pull/278) ([AlanFoster](https://github.com/AlanFoster))

## [6.0.2](https://github.com/wix/Detox/tree/6.0.2) (2017-11-28)
[Full Changelog](https://github.com/wix/Detox/compare/6.0.1...6.0.2)

**Closed Issues**

- How to disable "The stdout and stderr logs" [\#429](https://github.com/wix/Detox/issues/429)

## [6.0.1](https://github.com/wix/Detox/tree/6.0.1) (2017-11-28)
[Full Changelog](https://github.com/wix/Detox/compare/6.0.0...6.0.1)

## [6.0.0](https://github.com/wix/Detox/tree/6.0.0) (2017-11-27)
[Full Changelog](https://github.com/wix/Detox/compare/5.10.0...6.0.0)

**Enhancements**

- Display touch visualizers when using Detox [\#426](https://github.com/wix/Detox/issues/426)
- React Native version compatibility [\#405](https://github.com/wix/Detox/issues/405)
- Unable to connect to Genymotion emulator [\#386](https://github.com/wix/Detox/issues/386)
- Replace Jackson parser with a JSONObject [\#351](https://github.com/wix/Detox/issues/351)
- Redirect simulator stdout to runner stdout in `--verbose` mode. [\#72](https://github.com/wix/Detox/issues/72)
- Detox CLI: Jest integration fixes  [\#423](https://github.com/wix/Detox/pull/423) ([rotemmiz](https://github.com/rotemmiz))
- Implemented AttachedAndroidDriver device for connecting to Genymotion [\#397](https://github.com/wix/Detox/pull/397) ([vasyas](https://github.com/vasyas))

**Fixed Bugs**

- Crash due to attempt to create a weak store of an object being deallocated [\#428](https://github.com/wix/Detox/issues/428)
- Detox hangs if binary is not found [\#424](https://github.com/wix/Detox/issues/424)
- jest-jasmine2 issues [\#419](https://github.com/wix/Detox/issues/419)
- Crash in \_prettyPrintAppStateTracker [\#418](https://github.com/wix/Detox/issues/418)
- Timeout before emulator loads + terminated due to receipt of signal null [\#407](https://github.com/wix/Detox/issues/407)
- Detox fails to run tests with jest\(with both new and old implementations\) [\#363](https://github.com/wix/Detox/issues/363)

**Closed Issues**

- Publish new npm version [\#431](https://github.com/wix/Detox/issues/431)
- Uncaught exception: bridge is not set [\#430](https://github.com/wix/Detox/issues/430)
- 2 Screen same layout Multiple Matches Issue  [\#257](https://github.com/wix/Detox/issues/257)
- Element Locating and Timeout [\#255](https://github.com/wix/Detox/issues/255)
- Can't run detox tests for the iOS native app [\#254](https://github.com/wix/Detox/issues/254)
- \_getAbsolutePath\(\) not compatible with expo [\#235](https://github.com/wix/Detox/issues/235)
- RCTSegmentedControl not matchable [\#227](https://github.com/wix/Detox/issues/227)
- Using xPath to locate elements [\#197](https://github.com/wix/Detox/issues/197)
- Get coordinate of element [\#129](https://github.com/wix/Detox/issues/129)

**Merged Pull Requests**

- Unify all Detox packages versions [\#436](https://github.com/wix/Detox/pull/436) ([rotemmiz](https://github.com/rotemmiz))
- Support for filtering platform specific tests in detox-cli  [\#435](https://github.com/wix/Detox/pull/435) ([rotemmiz](https://github.com/rotemmiz))
- Better Android emulator sync [\#434](https://github.com/wix/Detox/pull/434) ([rotemmiz](https://github.com/rotemmiz))
- Minor documentation fix [\#421](https://github.com/wix/Detox/pull/421) ([plasticine](https://github.com/plasticine))
- Exchange com.fasterxml.jackson with org.json implementation [\#415](https://github.com/wix/Detox/pull/415) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Stop transpiling detox and detox-server, use sources and require node \>=7.6 [\#404](https://github.com/wix/Detox/pull/404) ([mrtnrst](https://github.com/mrtnrst))

## [5.10.0](https://github.com/wix/Detox/tree/5.10.0) (2017-11-15)
[Full Changelog](https://github.com/wix/Detox/compare/5.10.1...5.10.0)

**Enhancements**

- Add change log generation when publishing a version [\#409](https://github.com/wix/Detox/issues/409)

## [5.10.1](https://github.com/wix/Detox/tree/5.10.1) (2017-11-15)
[Full Changelog](https://github.com/wix/Detox/compare/detox-server@2.1.0...5.10.1)

**Enhancements**

- Expectation/matcher for counting elements [\#350](https://github.com/wix/Detox/issues/350)

**Fixed Bugs**

- Can't get app launched via Detox [\#247](https://github.com/wix/Detox/issues/247)

**Closed Issues**

- Asynchronous function issue [\#406](https://github.com/wix/Detox/issues/406)
- How to start the react-native debugger along with the test? [\#403](https://github.com/wix/Detox/issues/403)
- detox tests hangs on app crash [\#402](https://github.com/wix/Detox/issues/402)
- withTimeout not triggering with FlatList and react-native-loading-placeholder [\#390](https://github.com/wix/Detox/issues/390)
- Lack of the deterministic way to get a UINavigationButton [\#276](https://github.com/wix/Detox/issues/276)

**Merged Pull Requests**

- New demo project for react native jest [\#370](https://github.com/wix/Detox/pull/370) ([SMJ93](https://github.com/SMJ93))

## [detox-server@2.1.0](https://github.com/wix/Detox/tree/detox-server@2.1.0) (2017-11-13)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.10.0...detox-server@2.1.0)

## [detox@5.10.0](https://github.com/wix/Detox/tree/detox@5.10.0) (2017-11-13)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.9.3...detox@5.10.0)

**Enhancements**

- Detox.framework could not be found” when attempting “ios.none” type configuration [\#388](https://github.com/wix/Detox/issues/388)
- Mocha 4.0.x: Test process never finishes [\#368](https://github.com/wix/Detox/issues/368)
- Allow absolute app path [\#98](https://github.com/wix/Detox/issues/98)

**Fixed Bugs**

- Crash in prettyPrintAppStateTracker in Detox 5.9.3 [\#391](https://github.com/wix/Detox/issues/391)
- Detox.framework could not be found” when attempting “ios.none” type configuration [\#388](https://github.com/wix/Detox/issues/388)
- Running `build-framework-cache` produces different output directory than expected [\#380](https://github.com/wix/Detox/issues/380)
- Mocha 4.0.x: Test process never finishes [\#368](https://github.com/wix/Detox/issues/368)

**Closed Issues**

- Mocha 4.0.0 doesn't exit after running tests [\#398](https://github.com/wix/Detox/issues/398)
- Stops after a failing test [\#394](https://github.com/wix/Detox/issues/394)
- Jest is hanging after both Detox tests passed/failed [\#387](https://github.com/wix/Detox/issues/387)

## [detox@5.9.3](https://github.com/wix/Detox/tree/detox@5.9.3) (2017-11-02)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.9.2...detox@5.9.3)

**Merged Pull Requests**

- Move Detox.framework compilation to postinstall [\#373](https://github.com/wix/Detox/pull/373) ([rotemmiz](https://github.com/rotemmiz))
- Add documentation for android unit tests [\#365](https://github.com/wix/Detox/pull/365) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- improve android docs [\#361](https://github.com/wix/Detox/pull/361) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Update Jest-related docs [\#355](https://github.com/wix/Detox/pull/355) ([Kureev](https://github.com/Kureev))

## [detox@5.9.2](https://github.com/wix/Detox/tree/detox@5.9.2) (2017-10-22)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.9.1...detox@5.9.2)

**Fixed Bugs**

- Application stopped at UIWindow creation while running tests on simulator [\#341](https://github.com/wix/Detox/issues/341)

## [detox@5.9.1](https://github.com/wix/Detox/tree/detox@5.9.1) (2017-10-19)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.9.0...detox@5.9.1)

**Merged Pull Requests**

- Re-add matcher generation commits and add traits matcher to generated code [\#348](https://github.com/wix/Detox/pull/348) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [detox@5.9.0](https://github.com/wix/Detox/tree/detox@5.9.0) (2017-10-18)
[Full Changelog](https://github.com/wix/Detox/compare/detox-cli@1.0.3...detox@5.9.0)

**Enhancements**

- Missing command line dependencies should cause graceful failure [\#196](https://github.com/wix/Detox/issues/196)
- Continue investigation of DetoxHelper [\#106](https://github.com/wix/Detox/issues/106)

**Fixed Bugs**

- App launches but immediately closes [\#152](https://github.com/wix/Detox/issues/152)

**Closed Issues**

- Update the README Screenshot to use the latest version of EarlGrey. [\#145](https://github.com/wix/Detox/issues/145)

**Merged Pull Requests**

- Add snapshot tests for matchers [\#347](https://github.com/wix/Detox/pull/347) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Create a build matrix to support multiple version of React Native and OSs [\#345](https://github.com/wix/Detox/pull/345) ([rotemmiz](https://github.com/rotemmiz))
- Basic support for Jest runner [\#335](https://github.com/wix/Detox/pull/335) ([Kureev](https://github.com/Kureev))

## [detox-cli@1.0.3](https://github.com/wix/Detox/tree/detox-cli@1.0.3) (2017-10-17)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.8.4...detox-cli@1.0.3)

## [detox@5.8.4](https://github.com/wix/Detox/tree/detox@5.8.4) (2017-10-17)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.8.3...detox@5.8.4)

**Fixed Bugs**

- Detox incompatibility with Firebase SDK [\#270](https://github.com/wix/Detox/issues/270)

## [detox@5.8.3](https://github.com/wix/Detox/tree/detox@5.8.3) (2017-10-16)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.8.2...detox@5.8.3)

**Merged Pull Requests**

- Update README for required Xcode version [\#339](https://github.com/wix/Detox/pull/339) ([MoOx](https://github.com/MoOx))

## [detox@5.8.2](https://github.com/wix/Detox/tree/detox@5.8.2) (2017-10-12)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.8.1...detox@5.8.2)

**Enhancements**

- Integration with `jest` [\#143](https://github.com/wix/Detox/issues/143)

**Fixed Bugs**

- xcode8 multiple sim windows after several launches [\#294](https://github.com/wix/Detox/issues/294)
- std::\_\_1::bad\_function\_call \(crash when using RN \>= 0.48\) [\#279](https://github.com/wix/Detox/issues/279)

**Closed Issues**

- \[Feature request\] Support generate test report [\#323](https://github.com/wix/Detox/issues/323)
- \[question\] run on aws device farm or firebase test lab? [\#297](https://github.com/wix/Detox/issues/297)

**Merged Pull Requests**

- Improvements in setup of jest runner. Update GettingStarted documentation. [\#329](https://github.com/wix/Detox/pull/329) ([dsznajder](https://github.com/dsznajder))
- Fix Android atIndex matcher by fixing typo [\#321](https://github.com/wix/Detox/pull/321) ([pietropizzi](https://github.com/pietropizzi))
- Improve Android documentation [\#319](https://github.com/wix/Detox/pull/319) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Add documentation for the usage with Android [\#316](https://github.com/wix/Detox/pull/316) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Docs: Jest usage [\#315](https://github.com/wix/Detox/pull/315) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Move matchers to generated code [\#306](https://github.com/wix/Detox/pull/306) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Start teasing Android [\#303](https://github.com/wix/Detox/pull/303) ([GantMan](https://github.com/GantMan))
- Misspelled "identify". [\#302](https://github.com/wix/Detox/pull/302) ([joshuapinter](https://github.com/joshuapinter))
- Missing "e" in "none". [\#301](https://github.com/wix/Detox/pull/301) ([joshuapinter](https://github.com/joshuapinter))
- Note on configuring detox with Xcode workspaces [\#300](https://github.com/wix/Detox/pull/300) ([pedro](https://github.com/pedro))
- Text Actions: Move to generated code [\#299](https://github.com/wix/Detox/pull/299) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Scroll Amount Action: Move to generated code [\#298](https://github.com/wix/Detox/pull/298) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- \[Android\] label -\> contentDescription [\#293](https://github.com/wix/Detox/pull/293) ([simonracz](https://github.com/simonracz))

## [detox@5.8.1](https://github.com/wix/Detox/tree/detox@5.8.1) (2017-09-27)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.8.0...detox@5.8.1)

**Fixed Bugs**

-  Error: is it currently building [\#291](https://github.com/wix/Detox/issues/291)

## [detox@5.8.0](https://github.com/wix/Detox/tree/detox@5.8.0) (2017-09-27)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.7.0...detox@5.8.0)

**Merged Pull Requests**

- High grade Android Emulator/Device control [\#295](https://github.com/wix/Detox/pull/295) ([rotemmiz](https://github.com/rotemmiz))
- No more fb pains [\#292](https://github.com/wix/Detox/pull/292) ([DanielZlotin](https://github.com/DanielZlotin))

## [detox@5.7.0](https://github.com/wix/Detox/tree/detox@5.7.0) (2017-09-20)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.6.2...detox@5.7.0)

**Merged Pull Requests**

- Swift support [\#277](https://github.com/wix/Detox/pull/277) ([rotemmiz](https://github.com/rotemmiz))

## [detox@5.6.2](https://github.com/wix/Detox/tree/detox@5.6.2) (2017-09-09)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.6.1...detox@5.6.2)

**Fixed Bugs**

- Detox@5.6.1 npm@5.4.0 fails with Permission denied [\#259](https://github.com/wix/Detox/issues/259)
- React Native demo project fails in debug mode [\#158](https://github.com/wix/Detox/issues/158)

**Closed Issues**

- Error loading images with jest and detox [\#263](https://github.com/wix/Detox/issues/263)
- Generated GREYAction JS wrapper uses unsupported variable types [\#228](https://github.com/wix/Detox/issues/228)

**Merged Pull Requests**

- Updated Guide.RunningOnCI to include Bitrise instructions [\#264](https://github.com/wix/Detox/pull/264) ([Monte9](https://github.com/Monte9))
- Add support for GreyAction contentEdge to generated code [\#243](https://github.com/wix/Detox/pull/243) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Only generate methods with supported types [\#238](https://github.com/wix/Detox/pull/238) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Cleanup refactor [\#233](https://github.com/wix/Detox/pull/233) ([simonracz](https://github.com/simonracz))
- fix GREYDirection type mismatch [\#231](https://github.com/wix/Detox/pull/231) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Documentation around code generation [\#225](https://github.com/wix/Detox/pull/225) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- device: add `resetContentAndSettings` [\#217](https://github.com/wix/Detox/pull/217) ([formatlos](https://github.com/formatlos))
- Translate EarlGrey headers to Javascript calls [\#178](https://github.com/wix/Detox/pull/178) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [detox@5.6.1](https://github.com/wix/Detox/tree/detox@5.6.1) (2017-08-09)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.6.0...detox@5.6.1)

## [detox@5.6.0](https://github.com/wix/Detox/tree/detox@5.6.0) (2017-08-08)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.5.1...detox@5.6.0)

**Fixed Bugs**

- Could not cast value of type 'DetoxAppDelegateProxy' \(0x1043b7118\) to 'AppDelegate' \(0x104142a68\). [\#165](https://github.com/wix/Detox/issues/165)

**Merged Pull Requests**

- Uimodule [\#221](https://github.com/wix/Detox/pull/221) ([simonracz](https://github.com/simonracz))
- Adjust non-swiping direction start percentage to be above 0 [\#220](https://github.com/wix/Detox/pull/220) ([yedidyak](https://github.com/yedidyak))
- convert setLocation params to string with comma as decimal separator [\#219](https://github.com/wix/Detox/pull/219) ([formatlos](https://github.com/formatlos))
- Espresso [\#208](https://github.com/wix/Detox/pull/208) ([simonracz](https://github.com/simonracz))
- WIP: Location support [\#195](https://github.com/wix/Detox/pull/195) ([yogevbd](https://github.com/yogevbd))

## [detox@5.5.1](https://github.com/wix/Detox/tree/detox@5.5.1) (2017-07-19)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.5.0...detox@5.5.1)

**Fixed Bugs**

- relaunchApp from userNotification doesn't relaunch at all [\#205](https://github.com/wix/Detox/issues/205)

## [detox@5.5.0](https://github.com/wix/Detox/tree/detox@5.5.0) (2017-07-19)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.4.0...detox@5.5.0)

**Enhancements**

- Add support for sending app to background and bringing back to foreground [\#204](https://github.com/wix/Detox/issues/204)
- Command line arguments to app when testing [\#181](https://github.com/wix/Detox/issues/181)
- `detox.init\(\)` should not launch app [\#180](https://github.com/wix/Detox/issues/180)

**Fixed Bugs**

- Error: Detox.framework not found [\#191](https://github.com/wix/Detox/issues/191)

**Merged Pull Requests**

- Update APIRef.ActionsOnElement.md [\#203](https://github.com/wix/Detox/pull/203) ([isnifer](https://github.com/isnifer))
- App logs [\#200](https://github.com/wix/Detox/pull/200) ([silyevsk](https://github.com/silyevsk))
- Add support for tapAtPoint action [\#189](https://github.com/wix/Detox/pull/189) ([blankg](https://github.com/blankg))

## [detox@5.4.0](https://github.com/wix/Detox/tree/detox@5.4.0) (2017-07-11)
[Full Changelog](https://github.com/wix/Detox/compare/detox-server@2.0.4...detox@5.4.0)

## [detox-server@2.0.4](https://github.com/wix/Detox/tree/detox-server@2.0.4) (2017-07-10)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.3.1...detox-server@2.0.4)

## [detox@5.3.1](https://github.com/wix/Detox/tree/detox@5.3.1) (2017-07-10)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.3.0...detox@5.3.1)

**Enhancements**

- Add a way to clear app data [\#186](https://github.com/wix/Detox/issues/186)
- device.openURL pops-up a system alert which can't be turned off with Detox [\#172](https://github.com/wix/Detox/issues/172)
- Handle iOS permission dialogs [\#9](https://github.com/wix/Detox/issues/9)

**Fixed Bugs**

- device.openURL pops-up a system alert which can't be turned off with Detox [\#172](https://github.com/wix/Detox/issues/172)

**Closed Issues**

- replaceText does not trigger TextInput's onChangeText event [\#151](https://github.com/wix/Detox/issues/151)

**Merged Pull Requests**

- Fix typo sre =\> are [\#185](https://github.com/wix/Detox/pull/185) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [detox@5.3.0](https://github.com/wix/Detox/tree/detox@5.3.0) (2017-07-04)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.2.0...detox@5.3.0)

**Merged Pull Requests**

- Switched to booting the device directly \(related to https://github.co… [\#184](https://github.com/wix/Detox/pull/184) ([silyevsk](https://github.com/silyevsk))
- Fix type on APIRef.Matchers.md [\#177](https://github.com/wix/Detox/pull/177) ([xcarpentier](https://github.com/xcarpentier))
- Permissions api [\#176](https://github.com/wix/Detox/pull/176) ([rotemmiz](https://github.com/rotemmiz))

## [detox@5.2.0](https://github.com/wix/Detox/tree/detox@5.2.0) (2017-06-27)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.1.3...detox@5.2.0)

**Enhancements**

- \[feature\] Take a screenshot [\#93](https://github.com/wix/Detox/issues/93)

**Merged Pull Requests**

- Session per configuration [\#173](https://github.com/wix/Detox/pull/173) ([silyevsk](https://github.com/silyevsk))
- Upgraded eslint, added plugins. [\#168](https://github.com/wix/Detox/pull/168) ([simonracz](https://github.com/simonracz))
- Adb [\#166](https://github.com/wix/Detox/pull/166) ([simonracz](https://github.com/simonracz))
- Architecture overview [\#132](https://github.com/wix/Detox/pull/132) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [detox@5.1.3](https://github.com/wix/Detox/tree/detox@5.1.3) (2017-06-18)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.1.2...detox@5.1.3)

**Merged Pull Requests**

- Document percentage parameter in swipe action [\#163](https://github.com/wix/Detox/pull/163) ([yedidyak](https://github.com/yedidyak))
- Android support. Phase I. [\#148](https://github.com/wix/Detox/pull/148) ([simonracz](https://github.com/simonracz))

## [detox@5.1.2](https://github.com/wix/Detox/tree/detox@5.1.2) (2017-06-11)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.1.1...detox@5.1.2)

**Merged Pull Requests**

- Added optional percentage parameter to swipe action [\#162](https://github.com/wix/Detox/pull/162) ([yedidyak](https://github.com/yedidyak))

## [detox@5.1.1](https://github.com/wix/Detox/tree/detox@5.1.1) (2017-06-11)
[Full Changelog](https://github.com/wix/Detox/compare/detox-cli@1.0.2...detox@5.1.1)

**Closed Issues**

- Running `detox-cli` from project `node\_modules` causes an error [\#157](https://github.com/wix/Detox/issues/157)

**Merged Pull Requests**

- fixed the crash on older react native versions where there’s no `\_nod… [\#160](https://github.com/wix/Detox/pull/160) ([silyevsk](https://github.com/silyevsk))

## [detox-cli@1.0.2](https://github.com/wix/Detox/tree/detox-cli@1.0.2) (2017-06-07)
[Full Changelog](https://github.com/wix/Detox/compare/detox-server@2.0.3...detox-cli@1.0.2)

## [detox-server@2.0.3](https://github.com/wix/Detox/tree/detox-server@2.0.3) (2017-06-07)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.1.0...detox-server@2.0.3)

## [detox@5.1.0](https://github.com/wix/Detox/tree/detox@5.1.0) (2017-06-07)
[Full Changelog](https://github.com/wix/Detox/compare/detox-server@2.0.2...detox@5.1.0)

**Enhancements**

- \[Question\] Select picker [\#139](https://github.com/wix/Detox/issues/139)
- problems when using "waitFor" [\#138](https://github.com/wix/Detox/issues/138)
- \[feature\] Add support for Orientation Change [\#131](https://github.com/wix/Detox/issues/131)
- Test animation progress [\#130](https://github.com/wix/Detox/issues/130)
- Android version [\#36](https://github.com/wix/Detox/issues/36)

**Closed Issues**

- Failure on fbsimctl install [\#153](https://github.com/wix/Detox/issues/153)
- WebView Matchers [\#136](https://github.com/wix/Detox/issues/136)
- Try to type in different supported language [\#124](https://github.com/wix/Detox/issues/124)
- expose a method that returns the hierarchy for a given element [\#76](https://github.com/wix/Detox/issues/76)
- Potential flakiness issue with detox "should scroll for a small amount in direction" - travis failed [\#67](https://github.com/wix/Detox/issues/67)

**Merged Pull Requests**

- Animations issue [\#150](https://github.com/wix/Detox/pull/150) ([silyevsk](https://github.com/silyevsk))

## [detox-server@2.0.2](https://github.com/wix/Detox/tree/detox-server@2.0.2) (2017-05-29)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.0.12...detox-server@2.0.2)

## [detox@5.0.12](https://github.com/wix/Detox/tree/detox@5.0.12) (2017-05-29)
[Full Changelog](https://github.com/wix/Detox/compare/detox-server@2.0.1...detox@5.0.12)

## [detox-server@2.0.1](https://github.com/wix/Detox/tree/detox-server@2.0.1) (2017-05-29)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.0.11...detox-server@2.0.1)

## [detox@5.0.11](https://github.com/wix/Detox/tree/detox@5.0.11) (2017-05-29)
[Full Changelog](https://github.com/wix/Detox/compare/detox-server@1.2.3...detox@5.0.11)

## [detox-server@1.2.3](https://github.com/wix/Detox/tree/detox-server@1.2.3) (2017-05-28)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.0.10...detox-server@1.2.3)

## [detox@5.0.10](https://github.com/wix/Detox/tree/detox@5.0.10) (2017-05-28)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.0.9...detox@5.0.10)

**Merged Pull Requests**

- Device Orientation Manipulation  [\#133](https://github.com/wix/Detox/pull/133) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [detox@5.0.9](https://github.com/wix/Detox/tree/detox@5.0.9) (2017-05-24)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.0.8...detox@5.0.9)

**Enhancements**

- add app reuse option [\#46](https://github.com/wix/Detox/issues/46)

**Merged Pull Requests**

- Update APIRef.Matchers.md [\#135](https://github.com/wix/Detox/pull/135) ([isnifer](https://github.com/isnifer))
- Update APIRef.Element.md - fix broken links [\#125](https://github.com/wix/Detox/pull/125) ([isnifer](https://github.com/isnifer))

## [detox@5.0.8](https://github.com/wix/Detox/tree/detox@5.0.8) (2017-05-08)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.0.7...detox@5.0.8)

## [detox@5.0.7](https://github.com/wix/Detox/tree/detox@5.0.7) (2017-05-07)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.0.6...detox@5.0.7)

**Merged Pull Requests**

- changed detox-init writeFileSync [\#122](https://github.com/wix/Detox/pull/122) ([bogobogo](https://github.com/bogobogo))
- HW - Fix typos in README [\#121](https://github.com/wix/Detox/pull/121) ([HanWax](https://github.com/HanWax))
- Update README.md [\#117](https://github.com/wix/Detox/pull/117) ([dassir](https://github.com/dassir))

## [detox@5.0.6](https://github.com/wix/Detox/tree/detox@5.0.6) (2017-04-20)
[Full Changelog](https://github.com/wix/Detox/compare/detox-server@1.2.2...detox@5.0.6)

**Closed Issues**

- typeText and clearText sometimes fail due to keyboard sync [\#39](https://github.com/wix/Detox/issues/39)
- what's the best way to match tabs in iOS? [\#12](https://github.com/wix/Detox/issues/12)

**Merged Pull Requests**

- Add a create-e2e command [\#115](https://github.com/wix/Detox/pull/115) ([bogobogo](https://github.com/bogobogo))
- Usage [\#114](https://github.com/wix/Detox/pull/114) ([bogobogo](https://github.com/bogobogo))
- added testID and by.id tests to the react-native example app [\#113](https://github.com/wix/Detox/pull/113) ([bogobogo](https://github.com/bogobogo))
- Fixed demo-react-native for Android. [\#112](https://github.com/wix/Detox/pull/112) ([simonracz](https://github.com/simonracz))
- Clarify setup instructions [\#107](https://github.com/wix/Detox/pull/107) ([aarongreenwald](https://github.com/aarongreenwald))
- added `reuse` option to CLI [\#105](https://github.com/wix/Detox/pull/105) ([doronpr](https://github.com/doronpr))
- fix demo app config [\#104](https://github.com/wix/Detox/pull/104) ([doronpr](https://github.com/doronpr))
- wix mobile open source config file [\#101](https://github.com/wix/Detox/pull/101) ([bogobogo](https://github.com/bogobogo))

## [detox-server@1.2.2](https://github.com/wix/Detox/tree/detox-server@1.2.2) (2017-03-23)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.0.5...detox-server@1.2.2)

## [detox@5.0.5](https://github.com/wix/Detox/tree/detox@5.0.5) (2017-03-23)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.0.4...detox@5.0.5)

**Enhancements**

- Create a CLI module [\#56](https://github.com/wix/Detox/issues/56)
- Don't automatically install fbsimctl [\#47](https://github.com/wix/Detox/issues/47)

**Fixed Bugs**

- Failing tests pass, afterEach fails [\#52](https://github.com/wix/Detox/issues/52)

## [detox@5.0.4](https://github.com/wix/Detox/tree/detox@5.0.4) (2017-03-17)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.0.3...detox@5.0.4)

## [detox@5.0.3](https://github.com/wix/Detox/tree/detox@5.0.3) (2017-03-16)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.0.2...detox@5.0.3)

## [detox@5.0.2](https://github.com/wix/Detox/tree/detox@5.0.2) (2017-03-16)
[Full Changelog](https://github.com/wix/Detox/compare/detox-cli@1.0.1...detox@5.0.2)

## [detox-cli@1.0.1](https://github.com/wix/Detox/tree/detox-cli@1.0.1) (2017-03-16)
[Full Changelog](https://github.com/wix/Detox/compare/detox-server@1.2.1...detox-cli@1.0.1)

## [detox-server@1.2.1](https://github.com/wix/Detox/tree/detox-server@1.2.1) (2017-03-16)
[Full Changelog](https://github.com/wix/Detox/compare/detox@5.0.1...detox-server@1.2.1)

## [detox@5.0.1](https://github.com/wix/Detox/tree/detox@5.0.1) (2017-03-16)
[Full Changelog](https://github.com/wix/Detox/compare/detox@4.3.2...detox@5.0.1)

## [detox@4.3.2](https://github.com/wix/Detox/tree/detox@4.3.2) (2017-03-09)
[Full Changelog](https://github.com/wix/Detox/compare/detox@4.3.1...detox@4.3.2)

**Enhancements**

- Support es6 \(import, async await etc\) [\#62](https://github.com/wix/Detox/issues/62)
- Refactor invoke queue into promise queue and support inline awaits [\#38](https://github.com/wix/Detox/issues/38)

**Fixed Bugs**

- Support more than 1 action on simulator [\#58](https://github.com/wix/Detox/issues/58)

**Closed Issues**

- \[iOS\] Fail to type text with azerty Keyboard  [\#92](https://github.com/wix/Detox/issues/92)

**Merged Pull Requests**

- Need to tap fb keg for fbsimctl install via homebrew [\#89](https://github.com/wix/Detox/pull/89) ([brentvatne](https://github.com/brentvatne))

## [detox@4.3.1](https://github.com/wix/Detox/tree/detox@4.3.1) (2017-02-26)
[Full Changelog](https://github.com/wix/Detox/compare/detox@4.3.0...detox@4.3.1)

**Closed Issues**

- Potential flakiness issue with detox 4 - Doron [\#66](https://github.com/wix/Detox/issues/66)

**Merged Pull Requests**

- fix: ReferenceError: loglevel is not defined [\#88](https://github.com/wix/Detox/pull/88) ([doronpr](https://github.com/doronpr))

## [detox@4.3.0](https://github.com/wix/Detox/tree/detox@4.3.0) (2017-02-20)
[Full Changelog](https://github.com/wix/Detox/compare/detox@4.2.0...detox@4.3.0)

## [detox@4.2.0](https://github.com/wix/Detox/tree/detox@4.2.0) (2017-02-15)
[Full Changelog](https://github.com/wix/Detox/compare/detox@4.1.4...detox@4.2.0)

**Closed Issues**

- fbsimctl sometimes fails with timeout on Travis CI [\#68](https://github.com/wix/Detox/issues/68)

## [detox@4.1.4](https://github.com/wix/Detox/tree/detox@4.1.4) (2017-01-19)
[Full Changelog](https://github.com/wix/Detox/compare/detox@4.1.3...detox@4.1.4)

## [detox@4.1.3](https://github.com/wix/Detox/tree/detox@4.1.3) (2017-01-19)
[Full Changelog](https://github.com/wix/Detox/compare/detox@4.1.2...detox@4.1.3)

## [detox@4.1.2](https://github.com/wix/Detox/tree/detox@4.1.2) (2017-01-19)
[Full Changelog](https://github.com/wix/Detox/compare/detox-server@1.1.1...detox@4.1.2)

## [detox-server@1.1.1](https://github.com/wix/Detox/tree/detox-server@1.1.1) (2017-01-19)
[Full Changelog](https://github.com/wix/Detox/compare/detox@4.1.1...detox-server@1.1.1)

## [detox@4.1.1](https://github.com/wix/Detox/tree/detox@4.1.1) (2017-01-19)
[Full Changelog](https://github.com/wix/Detox/compare/v4.1.0...detox@4.1.1)

**Enhancements**

- Script to add scheme adds deployment target 7.0 [\#61](https://github.com/wix/Detox/issues/61)

**Fixed Bugs**

- Dev\_Detox build builds react in release mode [\#73](https://github.com/wix/Detox/issues/73)

## [v4.1.0](https://github.com/wix/Detox/tree/v4.1.0) (2017-01-17)
[Full Changelog](https://github.com/wix/Detox/compare/4.0.12...v4.1.0)

**Enhancements**

- Change API to use Promises instead of callbacks [\#57](https://github.com/wix/Detox/issues/57)

**Closed Issues**

- Using firebase seems to cause detox to hang [\#70](https://github.com/wix/Detox/issues/70)
- git submodules prevent from switching branches [\#49](https://github.com/wix/Detox/issues/49)

## [4.0.12](https://github.com/wix/Detox/tree/4.0.12) (2017-01-10)
[Full Changelog](https://github.com/wix/Detox/compare/1000...4.0.12)

**Merged Pull Requests**

- Timer observation overhaul [\#74](https://github.com/wix/Detox/pull/74) ([LeoNatan](https://github.com/LeoNatan))
- document a gotcha we ran into [\#69](https://github.com/wix/Detox/pull/69) ([doronpr](https://github.com/doronpr))
- Added replaceText action [\#65](https://github.com/wix/Detox/pull/65) ([yedidyak](https://github.com/yedidyak))

## [1000](https://github.com/wix/Detox/tree/1000) (2016-12-05)
[Full Changelog](https://github.com/wix/Detox/compare/4.0.9...1000)

## [4.0.9](https://github.com/wix/Detox/tree/4.0.9) (2016-12-05)
[Full Changelog](https://github.com/wix/Detox/compare/4.0.8...4.0.9)

## [4.0.8](https://github.com/wix/Detox/tree/4.0.8) (2016-12-05)
[Full Changelog](https://github.com/wix/Detox/compare/4.0.7...4.0.8)

## [4.0.7](https://github.com/wix/Detox/tree/4.0.7) (2016-12-04)
[Full Changelog](https://github.com/wix/Detox/compare/4.0.6...4.0.7)

## [4.0.6](https://github.com/wix/Detox/tree/4.0.6) (2016-12-04)
[Full Changelog](https://github.com/wix/Detox/compare/4.0.5...4.0.6)

**Closed Issues**

- Red screen - Invariant Violation [\#51](https://github.com/wix/Detox/issues/51)

## [4.0.5](https://github.com/wix/Detox/tree/4.0.5) (2016-12-01)
[Full Changelog](https://github.com/wix/Detox/compare/4.0.4...4.0.5)

## [4.0.4](https://github.com/wix/Detox/tree/4.0.4) (2016-12-01)
[Full Changelog](https://github.com/wix/Detox/compare/4.0.3...4.0.4)

## [4.0.3](https://github.com/wix/Detox/tree/4.0.3) (2016-12-01)
[Full Changelog](https://github.com/wix/Detox/compare/4.0.2...4.0.3)

## [4.0.2](https://github.com/wix/Detox/tree/4.0.2) (2016-12-01)
[Full Changelog](https://github.com/wix/Detox/compare/4.0.1...4.0.2)

**Enhancements**

- Improve iOS React Native sync mechanism [\#37](https://github.com/wix/Detox/issues/37)

**Fixed Bugs**

- Need to update dependencies - issues with Xcode 8, MacOS Sierra [\#44](https://github.com/wix/Detox/issues/44)
- React Native 0.34+ not supported - testee not connected, cannot fw action [\#43](https://github.com/wix/Detox/issues/43)

## [4.0.1](https://github.com/wix/Detox/tree/4.0.1) (2016-11-30)
[Full Changelog](https://github.com/wix/Detox/compare/3.2.1...4.0.1)

**Enhancements**

- ability to select non-accessible elements [\#31](https://github.com/wix/Detox/issues/31)

**Merged Pull Requests**

- Merge 4.0.0 branch into master [\#48](https://github.com/wix/Detox/pull/48) ([LeoNatan](https://github.com/LeoNatan))

## [3.2.1](https://github.com/wix/Detox/tree/3.2.1) (2016-10-12)
**Enhancements**

- add match by type [\#41](https://github.com/wix/Detox/issues/41)
- add not visible matcher [\#35](https://github.com/wix/Detox/issues/35)
- output UI Hierarchy on test failure [\#34](https://github.com/wix/Detox/issues/34)
- Add ability to wait for element to exist [\#30](https://github.com/wix/Detox/issues/30)
- Add ability to swipe a view [\#29](https://github.com/wix/Detox/issues/29)
- Add toMatch by id matcher [\#27](https://github.com/wix/Detox/issues/27)
- Add option to sendkeys to input [\#26](https://github.com/wix/Detox/issues/26)

**Closed Issues**

- App freezes on launch [\#20](https://github.com/wix/Detox/issues/20)

**Merged Pull Requests**

- added match by type [\#40](https://github.com/wix/Detox/pull/40) ([doronpr](https://github.com/doronpr))
- Added Tests of stressful conditions [\#21](https://github.com/wix/Detox/pull/21) ([EtgarSH](https://github.com/EtgarSH))
- gitignore and npmignore fixes [\#17](https://github.com/wix/Detox/pull/17) ([DanielZlotin](https://github.com/DanielZlotin))
- feat\(matchers\): fix typo [\#3](https://github.com/wix/Detox/pull/3) ([ofirdagan](https://github.com/ofirdagan))
- log error when Detox.framework dlopen fails [\#2](https://github.com/wix/Detox/pull/2) ([doronpr](https://github.com/doronpr))
- feat\(matchers\): add by id matcher [\#1](https://github.com/wix/Detox/pull/1) ([ofirdagan](https://github.com/ofirdagan))



\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*