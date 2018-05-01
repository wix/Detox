# Change Log

## [7.3.4](https://github.com/wix/detox/tree/7.3.4) (2018-04-25)
[Full Changelog](https://github.com/wix/detox/compare/7.3.3...7.3.4)

**Fixed Bugs**

- \[iOS\] Tests stall in detox.init, error: \[SRWebSocket sendString:error:\]: unrecognized selector sent to instance [\#689](https://github.com/wix/detox/issues/689)
- Detox Android incompatible with RN \>= 50 [\#608](https://github.com/wix/detox/issues/608)

**Closed Issues**

- TextInput label/id not getting picked up in detox [\#667](https://github.com/wix/detox/issues/667)

**Merged Pull Requests**

- docs: fix missing article name in table of contents [\#685](https://github.com/wix/detox/pull/685) ([noomorph](https://github.com/noomorph))
- \[Android\] Ensure main thread when doing getInstanceManager [\#681](https://github.com/wix/detox/pull/681) ([wiyarmir](https://github.com/wiyarmir))
- \[Android\] Enable usage of custom instrumentation test runners [\#675](https://github.com/wix/detox/pull/675) ([wiyarmir](https://github.com/wiyarmir))
- Avoid NPE when DetoxServerUrl and DetoxSessionId are not set [\#666](https://github.com/wix/detox/pull/666) ([wiyarmir](https://github.com/wiyarmir))
- Change 'deugging' to 'debugging' in TroubleShooting\#RunningTests docs [\#662](https://github.com/wix/detox/pull/662) ([johnbayne](https://github.com/johnbayne))
- Add generation for GREYInteraction [\#564](https://github.com/wix/detox/pull/564) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [7.3.3](https://github.com/wix/detox/tree/7.3.3) (2018-04-04)
[Full Changelog](https://github.com/wix/detox/compare/7.3.2...7.3.3)

**Fixed Bugs**

- Android: Running instrumentation requires ADB to be in path [\#651](https://github.com/wix/detox/issues/651)
- CLI: `detox test` fails to determine a default configuration [\#648](https://github.com/wix/detox/issues/648)
- Android: Support RN50-51 changes [\#652](https://github.com/wix/detox/pull/652) ([rotemmiz](https://github.com/rotemmiz))

## [7.3.2](https://github.com/wix/detox/tree/7.3.2) (2018-03-27)
[Full Changelog](https://github.com/wix/detox/compare/7.3.0...7.3.2)

## [7.3.0](https://github.com/wix/detox/tree/7.3.0) (2018-03-26)
[Full Changelog](https://github.com/wix/detox/compare/7.2.0...7.3.0)

**Enhancements**

- Support UserActivity [\#622](https://github.com/wix/detox/issues/622)
- Add Support for Device Shake Action [\#551](https://github.com/wix/detox/issues/551)

**Fixed Bugs**

- detox clean-framework-cache && detox build-framework-cache broken for internal development [\#619](https://github.com/wix/detox/issues/619)
- detox.init doesn't resolve in hybrid apps with initial native page \(until you manually navigate to a react native page\) [\#615](https://github.com/wix/detox/issues/615)
- `createPushNotificationJson` creates a notification.json file under a constant path [\#601](https://github.com/wix/detox/issues/601)

**Merged Pull Requests**

- CLI: Automatically filter platform tests by inferring from config [\#639](https://github.com/wix/detox/pull/639) ([rotemmiz](https://github.com/rotemmiz))
- iOS: Support spaces in app name [\#626](https://github.com/wix/detox/pull/626) ([ssg-luke](https://github.com/ssg-luke))
- CLI: Fixed typo in subcommand description [\#625](https://github.com/wix/detox/pull/625) ([vonovak](https://github.com/vonovak))
- iOS: Add support for userActivity API [\#623](https://github.com/wix/detox/pull/623) ([LeoNatan](https://github.com/LeoNatan))
- CLI: add -f option to run specific test file [\#616](https://github.com/wix/detox/pull/616) ([jeremyeaton89](https://github.com/jeremyeaton89))
- iOS: perform actions on UIPickerView [\#605](https://github.com/wix/detox/pull/605) ([DmitryPonomarenko](https://github.com/DmitryPonomarenko))

## [7.2.0](https://github.com/wix/detox/tree/7.2.0) (2018-03-12)
[Full Changelog](https://github.com/wix/detox/compare/7.1.0...7.2.0)

**Enhancements**

- Clean up after build\_framework [\#577](https://github.com/wix/detox/pull/577) ([MatthieuLemoine](https://github.com/MatthieuLemoine))

**Fixed Bugs**

- Husky hooks bugged out when attempting a commit [\#606](https://github.com/wix/detox/issues/606)
- Starting application from background with notification happens in foreground \(iOS\) [\#590](https://github.com/wix/detox/issues/590)
- Find element by text doesn't function with minimal project on latest version of RN and detox [\#572](https://github.com/wix/detox/issues/572)
- reason for test failure stopped being reported [\#5](https://github.com/wix/detox/issues/5)

**Merged Pull Requests**

- iOS: Improve notifications dispatch timing [\#604](https://github.com/wix/detox/pull/604) ([LeoNatan](https://github.com/LeoNatan))
- Kill Android instrumentation and nullify the object when it crashes [\#603](https://github.com/wix/detox/pull/603) ([rotemmiz](https://github.com/rotemmiz))
- Update Introduction.Android.md [\#596](https://github.com/wix/detox/pull/596) ([joegoodall1](https://github.com/joegoodall1))
- Better support for multiple RN version in test project + updated example projects [\#591](https://github.com/wix/detox/pull/591) ([rotemmiz](https://github.com/rotemmiz))
- Update Example .travis.yml in CI Guide [\#586](https://github.com/wix/detox/pull/586) ([mtmckenna](https://github.com/mtmckenna))
- Use travis branch to determine master [\#580](https://github.com/wix/detox/pull/580) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Docs: Use jest.setTimeout instead of jasmine timeout [\#562](https://github.com/wix/detox/pull/562) ([thymikee](https://github.com/thymikee))
- Add Support for ShakeDevice Action [\#559](https://github.com/wix/detox/pull/559) ([LeoNatan](https://github.com/LeoNatan))
- Support testApk path for gradle builds with multiple flavor matrix [\#554](https://github.com/wix/detox/pull/554) ([sdg9](https://github.com/sdg9))
- set location should not use comma [\#532](https://github.com/wix/detox/pull/532) ([hiaw](https://github.com/hiaw))
- Generation: combining and string matchers for android [\#496](https://github.com/wix/detox/pull/496) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [7.1.0](https://github.com/wix/detox/tree/7.1.0) (2018-02-12)
[Full Changelog](https://github.com/wix/detox/compare/7.0.1...7.1.0)

**Enhancements**

- Fix doc generation to only run from master [\#542](https://github.com/wix/detox/issues/542)
- export globals [\#275](https://github.com/wix/detox/issues/275)
- Look for a way to catch app crashes and report to the user, rather than have test stuck until timeout [\#161](https://github.com/wix/detox/issues/161)
- Android Support [\#96](https://github.com/wix/detox/issues/96)
- Add exception and signal handling for iOS [\#453](https://github.com/wix/detox/pull/453) ([LeoNatan](https://github.com/LeoNatan))

**Fixed Bugs**

- openURL API is broken [\#561](https://github.com/wix/detox/issues/561)

**Merged Pull Requests**

- Minor typo in Introduction.GettingStarted.md [\#555](https://github.com/wix/detox/pull/555) ([orta](https://github.com/orta))
- Website build only run on master [\#544](https://github.com/wix/detox/pull/544) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [7.0.1](https://github.com/wix/detox/tree/7.0.1) (2018-01-29)
[Full Changelog](https://github.com/wix/detox/compare/7.0.0...7.0.1)

**Merged Pull Requests**

- Fixes broken AndroidDriver explicit exportGlobals flow [\#545](https://github.com/wix/detox/pull/545) ([rotemmiz](https://github.com/rotemmiz))

## [7.0.0](https://github.com/wix/detox/tree/7.0.0) (2018-01-26)
[Full Changelog](https://github.com/wix/detox/compare/v7.0.0-alpha.1...7.0.0)

**Merged Pull Requests**

- export platform specific objects through proxy [\#374](https://github.com/wix/detox/pull/374) ([trofima](https://github.com/trofima))

## [v7.0.0-alpha.1](https://github.com/wix/detox/tree/v7.0.0-alpha.1) (2018-01-24)
[Full Changelog](https://github.com/wix/detox/compare/v7.0.0-alpha.0...v7.0.0-alpha.1)

**Fixed Bugs**

- Android test apk build path not aligned when using flavors [\#522](https://github.com/wix/detox/issues/522)

**Merged Pull Requests**

- Fixed section link in doc [\#539](https://github.com/wix/detox/pull/539) ([Brianwebb22](https://github.com/Brianwebb22))
- Fixes \#522: Android test apk path is now aligned with build flavors [\#537](https://github.com/wix/detox/pull/537) ([rotemmiz](https://github.com/rotemmiz))
- Correct grammar in docs [\#533](https://github.com/wix/detox/pull/533) ([tharax](https://github.com/tharax))
- Fix homepage in detox & detox-server package.json [\#531](https://github.com/wix/detox/pull/531) ([hectahertz](https://github.com/hectahertz))
- Update docs to fix hyperlink [\#519](https://github.com/wix/detox/pull/519) ([tharax](https://github.com/tharax))
- Fix wrong path to install Android script [\#514](https://github.com/wix/detox/pull/514) ([ygorbarboza](https://github.com/ygorbarboza))
- Add docusaurus for website [\#491](https://github.com/wix/detox/pull/491) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [v7.0.0-alpha.0](https://github.com/wix/detox/tree/v7.0.0-alpha.0) (2018-01-11)
[Full Changelog](https://github.com/wix/detox/compare/6.0.4...v7.0.0-alpha.0)

**Enhancements**

- Add automatic code formatting via prettier [\#223](https://github.com/wix/detox/issues/223)

**Fixed Bugs**

- atIndex\(\) seems to be broken on Android [\#498](https://github.com/wix/detox/issues/498)
- Getting Started also requires adding babel-polyfill [\#481](https://github.com/wix/detox/issues/481)
- Test release on Android: app-release-androidTest.apk: No such file or directory [\#455](https://github.com/wix/detox/issues/455)
- Both Android and iOS e2e tests fail when following contribution guide [\#369](https://github.com/wix/detox/issues/369)
- Problems on Android using Jest test runner [\#362](https://github.com/wix/detox/issues/362)
- Detox failed to install apk files [\#274](https://github.com/wix/detox/issues/274)

**Merged Pull Requests**

- Added support for emulators \<= API lvl 23 [\#506](https://github.com/wix/detox/pull/506) ([simonracz](https://github.com/simonracz))
- Fixed atIndex\(0\) for Android. [\#504](https://github.com/wix/detox/pull/504) ([simonracz](https://github.com/simonracz))
- Mention running on iOS device is not yet supported [\#499](https://github.com/wix/detox/pull/499) ([fdnhkj](https://github.com/fdnhkj))
- Update AndroidDriver.js [\#497](https://github.com/wix/detox/pull/497) ([Crash--](https://github.com/Crash--))
- Fix error message to not state false information [\#495](https://github.com/wix/detox/pull/495) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Add quotes around xcode version output [\#493](https://github.com/wix/detox/pull/493) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Generation: Add Android Matchers to generated code [\#492](https://github.com/wix/detox/pull/492) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Remove excessive curly bracket [\#490](https://github.com/wix/detox/pull/490) ([dluksza](https://github.com/dluksza))
- Generation: Move DetoxAction invocations to generated code [\#479](https://github.com/wix/detox/pull/479) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Fix typo in docs/Troubleshooting.RunningTests.md [\#475](https://github.com/wix/detox/pull/475) ([douglasnomizo](https://github.com/douglasnomizo))
- FIxed broken setURLBlacklist on Android [\#474](https://github.com/wix/detox/pull/474) ([rotemmiz](https://github.com/rotemmiz))
- \[BREAKING\] Upgrade to gradle 4.1 and android gradle plugin 3 [\#468](https://github.com/wix/detox/pull/468) ([rotemmiz](https://github.com/rotemmiz))
- Generation: Add generation for external files [\#465](https://github.com/wix/detox/pull/465) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Fix the link to Android Support Status page [\#461](https://github.com/wix/detox/pull/461) ([kkhaidukov](https://github.com/kkhaidukov))

## [6.0.4](https://github.com/wix/detox/tree/6.0.4) (2017-12-13)
[Full Changelog](https://github.com/wix/detox/compare/6.0.2...6.0.4)

**Enhancements**

- Add support for jest as a test runner [\#242](https://github.com/wix/detox/issues/242)
- Sync Issues if Native Modules with Network connection are used [\#146](https://github.com/wix/detox/issues/146)
- Use new logging infra for Detox logging [\#457](https://github.com/wix/detox/pull/457) ([LeoNatan](https://github.com/LeoNatan))

**Fixed Bugs**

- Idling resource pretty print does not actually print tracked objects [\#456](https://github.com/wix/detox/issues/456)
- Build Framework script not able to unarchive Detox-ios-src.tbz [\#438](https://github.com/wix/detox/issues/438)
- Detox is broken due to detox-server version 6.0.0 not released [\#437](https://github.com/wix/detox/issues/437)

**Merged Pull Requests**

- Add generation for tap at location [\#449](https://github.com/wix/detox/pull/449) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Generation: Remove unused helpers from generated code [\#448](https://github.com/wix/detox/pull/448) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Add prettier formatting for code generation [\#446](https://github.com/wix/detox/pull/446) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Fix several spelling typos [\#442](https://github.com/wix/detox/pull/442) ([sdg9](https://github.com/sdg9))
- Add support for generating android matchers [\#425](https://github.com/wix/detox/pull/425) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Add prettier to detox folder [\#278](https://github.com/wix/detox/pull/278) ([AlanFoster](https://github.com/AlanFoster))

## [6.0.2](https://github.com/wix/detox/tree/6.0.2) (2017-11-28)
[Full Changelog](https://github.com/wix/detox/compare/6.0.1...6.0.2)

**Closed Issues**

- How to disable "The stdout and stderr logs" [\#429](https://github.com/wix/detox/issues/429)

## [6.0.1](https://github.com/wix/detox/tree/6.0.1) (2017-11-28)
[Full Changelog](https://github.com/wix/detox/compare/6.0.0...6.0.1)

## [6.0.0](https://github.com/wix/detox/tree/6.0.0) (2017-11-27)
[Full Changelog](https://github.com/wix/detox/compare/5.10.0...6.0.0)

**Enhancements**

- Display touch visualizers when using Detox [\#426](https://github.com/wix/detox/issues/426)
- React Native version compatibility [\#405](https://github.com/wix/detox/issues/405)
- Unable to connect to Genymotion emulator [\#386](https://github.com/wix/detox/issues/386)
- Replace Jackson parser with a JSONObject [\#351](https://github.com/wix/detox/issues/351)
- Redirect simulator stdout to runner stdout in `--verbose` mode. [\#72](https://github.com/wix/detox/issues/72)
- Detox CLI: Jest integration fixes  [\#423](https://github.com/wix/detox/pull/423) ([rotemmiz](https://github.com/rotemmiz))
- Implemented AttachedAndroidDriver device for connecting to Genymotion [\#397](https://github.com/wix/detox/pull/397) ([vasyas](https://github.com/vasyas))

**Fixed Bugs**

- Crash due to attempt to create a weak store of an object being deallocated [\#428](https://github.com/wix/detox/issues/428)
- Detox hangs if binary is not found [\#424](https://github.com/wix/detox/issues/424)
- jest-jasmine2 issues [\#419](https://github.com/wix/detox/issues/419)
- Crash in \_prettyPrintAppStateTracker [\#418](https://github.com/wix/detox/issues/418)
- Timeout before emulator loads + terminated due to receipt of signal null [\#407](https://github.com/wix/detox/issues/407)
- Detox fails to run tests with jest\(with both new and old implementations\) [\#363](https://github.com/wix/detox/issues/363)

**Closed Issues**

- Uncaught exception: bridge is not set [\#430](https://github.com/wix/detox/issues/430)
- 2 Screen same layout Multiple Matches Issue  [\#257](https://github.com/wix/detox/issues/257)
- Element Locating and Timeout [\#255](https://github.com/wix/detox/issues/255)
- Can't run detox tests for the iOS native app [\#254](https://github.com/wix/detox/issues/254)
- RCTSegmentedControl not matchable [\#227](https://github.com/wix/detox/issues/227)

**Merged Pull Requests**

- Unify all Detox packages versions [\#436](https://github.com/wix/detox/pull/436) ([rotemmiz](https://github.com/rotemmiz))
- Support for filtering platform specific tests in detox-cli  [\#435](https://github.com/wix/detox/pull/435) ([rotemmiz](https://github.com/rotemmiz))
- Better Android emulator sync [\#434](https://github.com/wix/detox/pull/434) ([rotemmiz](https://github.com/rotemmiz))
- Minor documentation fix [\#421](https://github.com/wix/detox/pull/421) ([plasticine](https://github.com/plasticine))
- Exchange com.fasterxml.jackson with org.json implementation [\#415](https://github.com/wix/detox/pull/415) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Stop transpiling detox and detox-server, use sources and require node \>=7.6 [\#404](https://github.com/wix/detox/pull/404) ([mrtnrst](https://github.com/mrtnrst))

## [5.10.0](https://github.com/wix/detox/tree/5.10.0) (2017-11-15)
[Full Changelog](https://github.com/wix/detox/compare/5.10.1...5.10.0)

**Enhancements**

- Add change log generation when publishing a version [\#409](https://github.com/wix/detox/issues/409)

## [5.10.1](https://github.com/wix/detox/tree/5.10.1) (2017-11-15)
[Full Changelog](https://github.com/wix/detox/compare/detox-server@2.1.0...5.10.1)

**Fixed Bugs**

- Can't get app launched via Detox [\#247](https://github.com/wix/detox/issues/247)

**Merged Pull Requests**

- New demo project for react native jest [\#370](https://github.com/wix/detox/pull/370) ([SMJ93](https://github.com/SMJ93))

## [detox-server@2.1.0](https://github.com/wix/detox/tree/detox-server@2.1.0) (2017-11-13)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.10.0...detox-server@2.1.0)

## [detox@5.10.0](https://github.com/wix/detox/tree/detox@5.10.0) (2017-11-13)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.9.3...detox@5.10.0)

**Enhancements**

- Detox.framework could not be found” when attempting “ios.none” type configuration [\#388](https://github.com/wix/detox/issues/388)
- Mocha 4.0.x: Test process never finishes [\#368](https://github.com/wix/detox/issues/368)
- Allow absolute app path [\#98](https://github.com/wix/detox/issues/98)

**Fixed Bugs**

- Crash in prettyPrintAppStateTracker in Detox 5.9.3 [\#391](https://github.com/wix/detox/issues/391)
- Detox.framework could not be found” when attempting “ios.none” type configuration [\#388](https://github.com/wix/detox/issues/388)
- Running `build-framework-cache` produces different output directory than expected [\#380](https://github.com/wix/detox/issues/380)
- Mocha 4.0.x: Test process never finishes [\#368](https://github.com/wix/detox/issues/368)

## [detox@5.9.3](https://github.com/wix/detox/tree/detox@5.9.3) (2017-11-02)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.9.2...detox@5.9.3)

**Merged Pull Requests**

- Move Detox.framework compilation to postinstall [\#373](https://github.com/wix/detox/pull/373) ([rotemmiz](https://github.com/rotemmiz))
- Add documentation for android unit tests [\#365](https://github.com/wix/detox/pull/365) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- improve android docs [\#361](https://github.com/wix/detox/pull/361) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Update Jest-related docs [\#355](https://github.com/wix/detox/pull/355) ([Kureev](https://github.com/Kureev))

## [detox@5.9.2](https://github.com/wix/detox/tree/detox@5.9.2) (2017-10-22)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.9.1...detox@5.9.2)

**Fixed Bugs**

- Application stopped at UIWindow creation while running tests on simulator [\#341](https://github.com/wix/detox/issues/341)

## [detox@5.9.1](https://github.com/wix/detox/tree/detox@5.9.1) (2017-10-19)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.9.0...detox@5.9.1)

**Merged Pull Requests**

- Re-add matcher generation commits and add traits matcher to generated code [\#348](https://github.com/wix/detox/pull/348) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [detox@5.9.0](https://github.com/wix/detox/tree/detox@5.9.0) (2017-10-18)
[Full Changelog](https://github.com/wix/detox/compare/detox-cli@1.0.3...detox@5.9.0)

**Enhancements**

- Missing command line dependencies should cause graceful failure [\#196](https://github.com/wix/detox/issues/196)
- Continue investigation of DetoxHelper [\#106](https://github.com/wix/detox/issues/106)

**Fixed Bugs**

- App launches but immediately closes [\#152](https://github.com/wix/detox/issues/152)

**Merged Pull Requests**

- Add snapshot tests for matchers [\#347](https://github.com/wix/detox/pull/347) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Create a build matrix to support multiple version of React Native and OSs [\#345](https://github.com/wix/detox/pull/345) ([rotemmiz](https://github.com/rotemmiz))
- Basic support for Jest runner [\#335](https://github.com/wix/detox/pull/335) ([Kureev](https://github.com/Kureev))

## [detox-cli@1.0.3](https://github.com/wix/detox/tree/detox-cli@1.0.3) (2017-10-17)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.8.4...detox-cli@1.0.3)

## [detox@5.8.4](https://github.com/wix/detox/tree/detox@5.8.4) (2017-10-17)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.8.3...detox@5.8.4)

**Fixed Bugs**

- Detox incompatibility with Firebase SDK [\#270](https://github.com/wix/detox/issues/270)

## [detox@5.8.3](https://github.com/wix/detox/tree/detox@5.8.3) (2017-10-16)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.8.2...detox@5.8.3)

**Merged Pull Requests**

- Update README for required Xcode version [\#339](https://github.com/wix/detox/pull/339) ([MoOx](https://github.com/MoOx))

## [detox@5.8.2](https://github.com/wix/detox/tree/detox@5.8.2) (2017-10-12)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.8.1...detox@5.8.2)

**Enhancements**

- Integration with `jest` [\#143](https://github.com/wix/detox/issues/143)

**Fixed Bugs**

- xcode8 multiple sim windows after several launches [\#294](https://github.com/wix/detox/issues/294)
- std::\_\_1::bad\_function\_call \(crash when using RN \>= 0.48\) [\#279](https://github.com/wix/detox/issues/279)

**Merged Pull Requests**

- Improvements in setup of jest runner. Update GettingStarted documentation. [\#329](https://github.com/wix/detox/pull/329) ([dsznajder](https://github.com/dsznajder))
- Fix Android atIndex matcher by fixing typo [\#321](https://github.com/wix/detox/pull/321) ([pietropizzi](https://github.com/pietropizzi))
- Improve Android documentation [\#319](https://github.com/wix/detox/pull/319) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Add documentation for the usage with Android [\#316](https://github.com/wix/detox/pull/316) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Docs: Jest usage [\#315](https://github.com/wix/detox/pull/315) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Move matchers to generated code [\#306](https://github.com/wix/detox/pull/306) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Start teasing Android [\#303](https://github.com/wix/detox/pull/303) ([GantMan](https://github.com/GantMan))
- Misspelled "identify". [\#302](https://github.com/wix/detox/pull/302) ([joshuapinter](https://github.com/joshuapinter))
- Missing "e" in "none". [\#301](https://github.com/wix/detox/pull/301) ([joshuapinter](https://github.com/joshuapinter))
- Note on configuring detox with Xcode workspaces [\#300](https://github.com/wix/detox/pull/300) ([pedro](https://github.com/pedro))
- Text Actions: Move to generated code [\#299](https://github.com/wix/detox/pull/299) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Scroll Amount Action: Move to generated code [\#298](https://github.com/wix/detox/pull/298) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- \[Android\] label -\> contentDescription [\#293](https://github.com/wix/detox/pull/293) ([simonracz](https://github.com/simonracz))

## [detox@5.8.1](https://github.com/wix/detox/tree/detox@5.8.1) (2017-09-27)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.8.0...detox@5.8.1)

**Fixed Bugs**

-  Error: is it currently building [\#291](https://github.com/wix/detox/issues/291)

## [detox@5.8.0](https://github.com/wix/detox/tree/detox@5.8.0) (2017-09-27)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.7.0...detox@5.8.0)

**Merged Pull Requests**

- High grade Android Emulator/Device control [\#295](https://github.com/wix/detox/pull/295) ([rotemmiz](https://github.com/rotemmiz))
- No more fb pains [\#292](https://github.com/wix/detox/pull/292) ([DanielZlotin](https://github.com/DanielZlotin))

## [detox@5.7.0](https://github.com/wix/detox/tree/detox@5.7.0) (2017-09-20)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.6.2...detox@5.7.0)

**Merged Pull Requests**

- Swift support [\#277](https://github.com/wix/detox/pull/277) ([rotemmiz](https://github.com/rotemmiz))

## [detox@5.6.2](https://github.com/wix/detox/tree/detox@5.6.2) (2017-09-09)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.6.1...detox@5.6.2)

**Fixed Bugs**

- Detox@5.6.1 npm@5.4.0 fails with Permission denied [\#259](https://github.com/wix/detox/issues/259)
- React Native demo project fails in debug mode [\#158](https://github.com/wix/detox/issues/158)

**Closed Issues**

- Error loading images with jest and detox [\#263](https://github.com/wix/detox/issues/263)
- Generated GREYAction JS wrapper uses unsupported variable types [\#228](https://github.com/wix/detox/issues/228)

**Merged Pull Requests**

- Updated Guide.RunningOnCI to include Bitrise instructions [\#264](https://github.com/wix/detox/pull/264) ([Monte9](https://github.com/Monte9))
- Add support for GreyAction contentEdge to generated code [\#243](https://github.com/wix/detox/pull/243) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Only generate methods with supported types [\#238](https://github.com/wix/detox/pull/238) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Cleanup refactor [\#233](https://github.com/wix/detox/pull/233) ([simonracz](https://github.com/simonracz))
- fix GREYDirection type mismatch [\#231](https://github.com/wix/detox/pull/231) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Documentation around code generation [\#225](https://github.com/wix/detox/pull/225) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- device: add `resetContentAndSettings` [\#217](https://github.com/wix/detox/pull/217) ([formatlos](https://github.com/formatlos))
- Translate EarlGrey headers to Javascript calls [\#178](https://github.com/wix/detox/pull/178) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [detox@5.6.1](https://github.com/wix/detox/tree/detox@5.6.1) (2017-08-09)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.6.0...detox@5.6.1)

## [detox@5.6.0](https://github.com/wix/detox/tree/detox@5.6.0) (2017-08-08)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.5.1...detox@5.6.0)

**Fixed Bugs**

- Could not cast value of type 'DetoxAppDelegateProxy' \(0x1043b7118\) to 'AppDelegate' \(0x104142a68\). [\#165](https://github.com/wix/detox/issues/165)

**Merged Pull Requests**

- Uimodule [\#221](https://github.com/wix/detox/pull/221) ([simonracz](https://github.com/simonracz))
- Adjust non-swiping direction start percentage to be above 0 [\#220](https://github.com/wix/detox/pull/220) ([yedidyak](https://github.com/yedidyak))
- convert setLocation params to string with comma as decimal separator [\#219](https://github.com/wix/detox/pull/219) ([formatlos](https://github.com/formatlos))
- Espresso [\#208](https://github.com/wix/detox/pull/208) ([simonracz](https://github.com/simonracz))
- WIP: Location support [\#195](https://github.com/wix/detox/pull/195) ([yogevbd](https://github.com/yogevbd))

## [detox@5.5.1](https://github.com/wix/detox/tree/detox@5.5.1) (2017-07-19)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.5.0...detox@5.5.1)

**Fixed Bugs**

- relaunchApp from userNotification doesn't relaunch at all [\#205](https://github.com/wix/detox/issues/205)

## [detox@5.5.0](https://github.com/wix/detox/tree/detox@5.5.0) (2017-07-19)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.4.0...detox@5.5.0)

**Enhancements**

- Add support for sending app to background and bringing back to foreground [\#204](https://github.com/wix/detox/issues/204)
- Command line arguments to app when testing [\#181](https://github.com/wix/detox/issues/181)
- `detox.init\(\)` should not launch app [\#180](https://github.com/wix/detox/issues/180)

**Fixed Bugs**

- Error: Detox.framework not found [\#191](https://github.com/wix/detox/issues/191)

**Merged Pull Requests**

- Update APIRef.ActionsOnElement.md [\#203](https://github.com/wix/detox/pull/203) ([isnifer](https://github.com/isnifer))
- App logs [\#200](https://github.com/wix/detox/pull/200) ([silyevsk](https://github.com/silyevsk))
- Add support for tapAtPoint action [\#189](https://github.com/wix/detox/pull/189) ([blankg](https://github.com/blankg))

## [detox@5.4.0](https://github.com/wix/detox/tree/detox@5.4.0) (2017-07-11)
[Full Changelog](https://github.com/wix/detox/compare/detox-server@2.0.4...detox@5.4.0)

## [detox-server@2.0.4](https://github.com/wix/detox/tree/detox-server@2.0.4) (2017-07-10)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.3.1...detox-server@2.0.4)

## [detox@5.3.1](https://github.com/wix/detox/tree/detox@5.3.1) (2017-07-10)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.3.0...detox@5.3.1)

**Enhancements**

- device.openURL pops-up a system alert which can't be turned off with Detox [\#172](https://github.com/wix/detox/issues/172)
- Handle iOS permission dialogs [\#9](https://github.com/wix/detox/issues/9)

**Fixed Bugs**

- device.openURL pops-up a system alert which can't be turned off with Detox [\#172](https://github.com/wix/detox/issues/172)

**Closed Issues**

- replaceText does not trigger TextInput's onChangeText event [\#151](https://github.com/wix/detox/issues/151)

**Merged Pull Requests**

- Fix typo sre =\> are [\#185](https://github.com/wix/detox/pull/185) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [detox@5.3.0](https://github.com/wix/detox/tree/detox@5.3.0) (2017-07-04)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.2.0...detox@5.3.0)

**Merged Pull Requests**

- Switched to booting the device directly \(related to https://github.co… [\#184](https://github.com/wix/detox/pull/184) ([silyevsk](https://github.com/silyevsk))
- Fix type on APIRef.Matchers.md [\#177](https://github.com/wix/detox/pull/177) ([xcarpentier](https://github.com/xcarpentier))
- Permissions api [\#176](https://github.com/wix/detox/pull/176) ([rotemmiz](https://github.com/rotemmiz))

## [detox@5.2.0](https://github.com/wix/detox/tree/detox@5.2.0) (2017-06-27)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.1.3...detox@5.2.0)

**Enhancements**

- \[feature\] Take a screenshot [\#93](https://github.com/wix/detox/issues/93)

**Merged Pull Requests**

- Session per configuration [\#173](https://github.com/wix/detox/pull/173) ([silyevsk](https://github.com/silyevsk))
- Upgraded eslint, added plugins. [\#168](https://github.com/wix/detox/pull/168) ([simonracz](https://github.com/simonracz))
- Adb [\#166](https://github.com/wix/detox/pull/166) ([simonracz](https://github.com/simonracz))
- Architecture overview [\#132](https://github.com/wix/detox/pull/132) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [detox@5.1.3](https://github.com/wix/detox/tree/detox@5.1.3) (2017-06-18)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.1.2...detox@5.1.3)

**Merged Pull Requests**

- Document percentage parameter in swipe action [\#163](https://github.com/wix/detox/pull/163) ([yedidyak](https://github.com/yedidyak))
- Android support. Phase I. [\#148](https://github.com/wix/detox/pull/148) ([simonracz](https://github.com/simonracz))

## [detox@5.1.2](https://github.com/wix/detox/tree/detox@5.1.2) (2017-06-11)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.1.1...detox@5.1.2)

**Merged Pull Requests**

- Added optional percentage parameter to swipe action [\#162](https://github.com/wix/detox/pull/162) ([yedidyak](https://github.com/yedidyak))

## [detox@5.1.1](https://github.com/wix/detox/tree/detox@5.1.1) (2017-06-11)
[Full Changelog](https://github.com/wix/detox/compare/detox-server@2.0.3...detox@5.1.1)

**Merged Pull Requests**

- fixed the crash on older react native versions where there’s no `\_nod… [\#160](https://github.com/wix/detox/pull/160) ([silyevsk](https://github.com/silyevsk))

## [detox-server@2.0.3](https://github.com/wix/detox/tree/detox-server@2.0.3) (2017-06-07)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.1.0...detox-server@2.0.3)

## [detox@5.1.0](https://github.com/wix/detox/tree/detox@5.1.0) (2017-06-07)
[Full Changelog](https://github.com/wix/detox/compare/detox-cli@1.0.2...detox@5.1.0)

## [detox-cli@1.0.2](https://github.com/wix/detox/tree/detox-cli@1.0.2) (2017-06-07)
[Full Changelog](https://github.com/wix/detox/compare/detox-server@2.0.2...detox-cli@1.0.2)

**Enhancements**

- \[Question\] Select picker [\#139](https://github.com/wix/detox/issues/139)
- problems when using "waitFor" [\#138](https://github.com/wix/detox/issues/138)
- \[feature\] Add support for Orientation Change [\#131](https://github.com/wix/detox/issues/131)
- Test animation progress [\#130](https://github.com/wix/detox/issues/130)
- Android version [\#36](https://github.com/wix/detox/issues/36)

**Closed Issues**

- WebView Matchers [\#136](https://github.com/wix/detox/issues/136)
- Try to type in different supported language [\#124](https://github.com/wix/detox/issues/124)
- expose a method that returns the hierarchy for a given element [\#76](https://github.com/wix/detox/issues/76)
- Potential flakiness issue with detox "should scroll for a small amount in direction" - travis failed [\#67](https://github.com/wix/detox/issues/67)

**Merged Pull Requests**

- Animations issue [\#150](https://github.com/wix/detox/pull/150) ([silyevsk](https://github.com/silyevsk))

## [detox-server@2.0.2](https://github.com/wix/detox/tree/detox-server@2.0.2) (2017-05-29)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.12...detox-server@2.0.2)

## [detox@5.0.12](https://github.com/wix/detox/tree/detox@5.0.12) (2017-05-29)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.11...detox@5.0.12)

## [detox@5.0.11](https://github.com/wix/detox/tree/detox@5.0.11) (2017-05-29)
[Full Changelog](https://github.com/wix/detox/compare/detox-server@2.0.1...detox@5.0.11)

## [detox-server@2.0.1](https://github.com/wix/detox/tree/detox-server@2.0.1) (2017-05-29)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.10...detox-server@2.0.1)

## [detox@5.0.10](https://github.com/wix/detox/tree/detox@5.0.10) (2017-05-28)
[Full Changelog](https://github.com/wix/detox/compare/detox-server@1.2.3...detox@5.0.10)

## [detox-server@1.2.3](https://github.com/wix/detox/tree/detox-server@1.2.3) (2017-05-28)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.9...detox-server@1.2.3)

**Merged Pull Requests**

- Device Orientation Manipulation  [\#133](https://github.com/wix/detox/pull/133) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [detox@5.0.9](https://github.com/wix/detox/tree/detox@5.0.9) (2017-05-24)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.8...detox@5.0.9)

**Enhancements**

- add app reuse option [\#46](https://github.com/wix/detox/issues/46)

**Merged Pull Requests**

- Update APIRef.Matchers.md [\#135](https://github.com/wix/detox/pull/135) ([isnifer](https://github.com/isnifer))
- Update APIRef.Element.md - fix broken links [\#125](https://github.com/wix/detox/pull/125) ([isnifer](https://github.com/isnifer))

## [detox@5.0.8](https://github.com/wix/detox/tree/detox@5.0.8) (2017-05-08)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.7...detox@5.0.8)

## [detox@5.0.7](https://github.com/wix/detox/tree/detox@5.0.7) (2017-05-07)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.6...detox@5.0.7)

**Merged Pull Requests**

- changed detox-init writeFileSync [\#122](https://github.com/wix/detox/pull/122) ([bogobogo](https://github.com/bogobogo))
- HW - Fix typos in README [\#121](https://github.com/wix/detox/pull/121) ([HanWax](https://github.com/HanWax))
- Update README.md [\#117](https://github.com/wix/detox/pull/117) ([dassir](https://github.com/dassir))

## [detox@5.0.6](https://github.com/wix/detox/tree/detox@5.0.6) (2017-04-20)
[Full Changelog](https://github.com/wix/detox/compare/detox-server@1.2.2...detox@5.0.6)

**Closed Issues**

- typeText and clearText sometimes fail due to keyboard sync [\#39](https://github.com/wix/detox/issues/39)
- what's the best way to match tabs in iOS? [\#12](https://github.com/wix/detox/issues/12)

**Merged Pull Requests**

- Add a create-e2e command [\#115](https://github.com/wix/detox/pull/115) ([bogobogo](https://github.com/bogobogo))
- Usage [\#114](https://github.com/wix/detox/pull/114) ([bogobogo](https://github.com/bogobogo))
- added testID and by.id tests to the react-native example app [\#113](https://github.com/wix/detox/pull/113) ([bogobogo](https://github.com/bogobogo))
- Fixed demo-react-native for Android. [\#112](https://github.com/wix/detox/pull/112) ([simonracz](https://github.com/simonracz))
- Clarify setup instructions [\#107](https://github.com/wix/detox/pull/107) ([aarongreenwald](https://github.com/aarongreenwald))
- added `reuse` option to CLI [\#105](https://github.com/wix/detox/pull/105) ([doronpr](https://github.com/doronpr))
- fix demo app config [\#104](https://github.com/wix/detox/pull/104) ([doronpr](https://github.com/doronpr))
- wix mobile open source config file [\#101](https://github.com/wix/detox/pull/101) ([bogobogo](https://github.com/bogobogo))

## [detox-server@1.2.2](https://github.com/wix/detox/tree/detox-server@1.2.2) (2017-03-23)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.5...detox-server@1.2.2)

## [detox@5.0.5](https://github.com/wix/detox/tree/detox@5.0.5) (2017-03-23)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.4...detox@5.0.5)

**Enhancements**

- Create a CLI module [\#56](https://github.com/wix/detox/issues/56)
- Don't automatically install fbsimctl [\#47](https://github.com/wix/detox/issues/47)

**Fixed Bugs**

- Failing tests pass, afterEach fails [\#52](https://github.com/wix/detox/issues/52)

## [detox@5.0.4](https://github.com/wix/detox/tree/detox@5.0.4) (2017-03-17)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.3...detox@5.0.4)

## [detox@5.0.3](https://github.com/wix/detox/tree/detox@5.0.3) (2017-03-16)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.2...detox@5.0.3)

## [detox@5.0.2](https://github.com/wix/detox/tree/detox@5.0.2) (2017-03-16)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.1...detox@5.0.2)

## [detox@5.0.1](https://github.com/wix/detox/tree/detox@5.0.1) (2017-03-16)
[Full Changelog](https://github.com/wix/detox/compare/detox-cli@1.0.1...detox@5.0.1)

## [detox-cli@1.0.1](https://github.com/wix/detox/tree/detox-cli@1.0.1) (2017-03-16)
[Full Changelog](https://github.com/wix/detox/compare/detox-server@1.2.1...detox-cli@1.0.1)

## [detox-server@1.2.1](https://github.com/wix/detox/tree/detox-server@1.2.1) (2017-03-16)
[Full Changelog](https://github.com/wix/detox/compare/detox@4.3.2...detox-server@1.2.1)

## [detox@4.3.2](https://github.com/wix/detox/tree/detox@4.3.2) (2017-03-09)
[Full Changelog](https://github.com/wix/detox/compare/detox@4.3.1...detox@4.3.2)

**Enhancements**

- Support es6 \(import, async await etc\) [\#62](https://github.com/wix/detox/issues/62)
- Refactor invoke queue into promise queue and support inline awaits [\#38](https://github.com/wix/detox/issues/38)

**Closed Issues**

- \[iOS\] Fail to type text with azerty Keyboard  [\#92](https://github.com/wix/detox/issues/92)

**Merged Pull Requests**

- Need to tap fb keg for fbsimctl install via homebrew [\#89](https://github.com/wix/detox/pull/89) ([brentvatne](https://github.com/brentvatne))

## [detox@4.3.1](https://github.com/wix/detox/tree/detox@4.3.1) (2017-02-26)
[Full Changelog](https://github.com/wix/detox/compare/detox@4.3.0...detox@4.3.1)

**Closed Issues**

- Potential flakiness issue with detox 4 - Doron [\#66](https://github.com/wix/detox/issues/66)

**Merged Pull Requests**

- fix: ReferenceError: loglevel is not defined [\#88](https://github.com/wix/detox/pull/88) ([doronpr](https://github.com/doronpr))

## [detox@4.3.0](https://github.com/wix/detox/tree/detox@4.3.0) (2017-02-20)
[Full Changelog](https://github.com/wix/detox/compare/detox@4.2.0...detox@4.3.0)

## [detox@4.2.0](https://github.com/wix/detox/tree/detox@4.2.0) (2017-02-15)
[Full Changelog](https://github.com/wix/detox/compare/detox@4.1.4...detox@4.2.0)

**Closed Issues**

- fbsimctl sometimes fails with timeout on Travis CI [\#68](https://github.com/wix/detox/issues/68)

## [detox@4.1.4](https://github.com/wix/detox/tree/detox@4.1.4) (2017-01-19)
[Full Changelog](https://github.com/wix/detox/compare/detox@4.1.3...detox@4.1.4)

## [detox@4.1.3](https://github.com/wix/detox/tree/detox@4.1.3) (2017-01-19)
[Full Changelog](https://github.com/wix/detox/compare/detox@4.1.2...detox@4.1.3)

## [detox@4.1.2](https://github.com/wix/detox/tree/detox@4.1.2) (2017-01-19)
[Full Changelog](https://github.com/wix/detox/compare/detox@4.1.1...detox@4.1.2)

## [detox@4.1.1](https://github.com/wix/detox/tree/detox@4.1.1) (2017-01-19)
[Full Changelog](https://github.com/wix/detox/compare/detox-server@1.1.1...detox@4.1.1)

## [detox-server@1.1.1](https://github.com/wix/detox/tree/detox-server@1.1.1) (2017-01-19)
[Full Changelog](https://github.com/wix/detox/compare/v4.1.0...detox-server@1.1.1)

**Enhancements**

- Script to add scheme adds deployment target 7.0 [\#61](https://github.com/wix/detox/issues/61)

**Fixed Bugs**

- Dev\_Detox build builds react in release mode [\#73](https://github.com/wix/detox/issues/73)

## [v4.1.0](https://github.com/wix/detox/tree/v4.1.0) (2017-01-17)
[Full Changelog](https://github.com/wix/detox/compare/4.0.12...v4.1.0)

**Closed Issues**

- Using firebase seems to cause detox to hang [\#70](https://github.com/wix/detox/issues/70)

## [4.0.12](https://github.com/wix/detox/tree/4.0.12) (2017-01-10)
[Full Changelog](https://github.com/wix/detox/compare/1000...4.0.12)

**Merged Pull Requests**

- Timer observation overhaul [\#74](https://github.com/wix/detox/pull/74) ([LeoNatan](https://github.com/LeoNatan))
- document a gotcha we ran into [\#69](https://github.com/wix/detox/pull/69) ([doronpr](https://github.com/doronpr))
- Added replaceText action [\#65](https://github.com/wix/detox/pull/65) ([yedidyak](https://github.com/yedidyak))

## [1000](https://github.com/wix/detox/tree/1000) (2016-12-05)
[Full Changelog](https://github.com/wix/detox/compare/4.0.9...1000)

## [4.0.9](https://github.com/wix/detox/tree/4.0.9) (2016-12-05)
[Full Changelog](https://github.com/wix/detox/compare/4.0.8...4.0.9)

## [4.0.8](https://github.com/wix/detox/tree/4.0.8) (2016-12-05)
[Full Changelog](https://github.com/wix/detox/compare/4.0.7...4.0.8)

## [4.0.7](https://github.com/wix/detox/tree/4.0.7) (2016-12-04)
[Full Changelog](https://github.com/wix/detox/compare/4.0.6...4.0.7)

## [4.0.6](https://github.com/wix/detox/tree/4.0.6) (2016-12-04)
[Full Changelog](https://github.com/wix/detox/compare/4.0.5...4.0.6)

## [4.0.5](https://github.com/wix/detox/tree/4.0.5) (2016-12-01)
[Full Changelog](https://github.com/wix/detox/compare/4.0.4...4.0.5)

## [4.0.4](https://github.com/wix/detox/tree/4.0.4) (2016-12-01)
[Full Changelog](https://github.com/wix/detox/compare/4.0.3...4.0.4)

## [4.0.3](https://github.com/wix/detox/tree/4.0.3) (2016-12-01)
[Full Changelog](https://github.com/wix/detox/compare/4.0.2...4.0.3)

## [4.0.2](https://github.com/wix/detox/tree/4.0.2) (2016-12-01)
[Full Changelog](https://github.com/wix/detox/compare/4.0.1...4.0.2)

**Enhancements**

- Improve iOS React Native sync mechanism [\#37](https://github.com/wix/detox/issues/37)

**Fixed Bugs**

- Need to update dependencies - issues with Xcode 8, MacOS Sierra [\#44](https://github.com/wix/detox/issues/44)
- React Native 0.34+ not supported - testee not connected, cannot fw action [\#43](https://github.com/wix/detox/issues/43)

## [4.0.1](https://github.com/wix/detox/tree/4.0.1) (2016-11-30)
[Full Changelog](https://github.com/wix/detox/compare/3.2.1...4.0.1)

**Enhancements**

- ability to select non-accessible elements [\#31](https://github.com/wix/detox/issues/31)

**Merged Pull Requests**

- Merge 4.0.0 branch into master [\#48](https://github.com/wix/detox/pull/48) ([LeoNatan](https://github.com/LeoNatan))

## [3.2.1](https://github.com/wix/detox/tree/3.2.1) (2016-10-12)
**Enhancements**

- add match by type [\#41](https://github.com/wix/detox/issues/41)
- add not visible matcher [\#35](https://github.com/wix/detox/issues/35)
- output UI Hierarchy on test failure [\#34](https://github.com/wix/detox/issues/34)
- Add ability to wait for element to exist [\#30](https://github.com/wix/detox/issues/30)
- Add ability to swipe a view [\#29](https://github.com/wix/detox/issues/29)
- Add toMatch by id matcher [\#27](https://github.com/wix/detox/issues/27)
- Add option to sendkeys to input [\#26](https://github.com/wix/detox/issues/26)

**Closed Issues**

- App freezes on launch [\#20](https://github.com/wix/detox/issues/20)

**Merged Pull Requests**

- added match by type [\#40](https://github.com/wix/detox/pull/40) ([doronpr](https://github.com/doronpr))
- Added Tests of stressful conditions [\#21](https://github.com/wix/detox/pull/21) ([EtgarSH](https://github.com/EtgarSH))
- gitignore and npmignore fixes [\#17](https://github.com/wix/detox/pull/17) ([DanielZlotin](https://github.com/DanielZlotin))
- feat\(matchers\): fix typo [\#3](https://github.com/wix/detox/pull/3) ([ofirdagan](https://github.com/ofirdagan))
- log error when Detox.framework dlopen fails [\#2](https://github.com/wix/detox/pull/2) ([doronpr](https://github.com/doronpr))
- feat\(matchers\): add by id matcher [\#1](https://github.com/wix/detox/pull/1) ([ofirdagan](https://github.com/ofirdagan))



\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*