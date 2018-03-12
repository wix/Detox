# Change Log

## [7.2.0](https://github.com/wix/detox/tree/7.2.0) (2018-03-12)
[Full Changelog](https://github.com/wix/detox/compare/7.1.0...7.2.0)

**Enhancements**

- Generate JSDoc comments for generated code [\#521](https://github.com/wix/detox/issues/521)
- Add point to point panning API [\#154](https://github.com/wix/detox/issues/154)
- Clean up after build\_framework [\#577](https://github.com/wix/detox/pull/577) ([MatthieuLemoine](https://github.com/MatthieuLemoine))

**Fixed Bugs**

- Husky hooks bugged out when attempting a commit [\#606](https://github.com/wix/detox/issues/606)
- Starting application from background with notification happens in foreground \(iOS\) [\#590](https://github.com/wix/detox/issues/590)
- Find element by text doesn't function with minimal project on latest version of RN and detox [\#572](https://github.com/wix/detox/issues/572)
- Detox failed to start testing in my react native project [\#548](https://github.com/wix/detox/issues/548)
- Detox is flaky on Travis CI [\#452](https://github.com/wix/detox/issues/452)
- xcodebuild puts binaries in different locations than expected [\#330](https://github.com/wix/detox/issues/330)
- reason for test failure stopped being reported [\#5](https://github.com/wix/detox/issues/5)

**Closed Issues**

- detox is not installed in this directory [\#612](https://github.com/wix/detox/issues/612)
- Test support bot [\#611](https://github.com/wix/detox/issues/611)
- Not able to run detox test \(Error: connect ECONNREFUSED\) [\#597](https://github.com/wix/detox/issues/597)
- Cannot perform action due to constraint\(s\) failure [\#585](https://github.com/wix/detox/issues/585)
- How to use dataset file in detox  [\#584](https://github.com/wix/detox/issues/584)
- detox is not installed in this directory [\#581](https://github.com/wix/detox/issues/581)
- Disabling animation synchronisation on iOS [\#488](https://github.com/wix/detox/issues/488)
- Detox not working with react native v0.51 [\#478](https://github.com/wix/detox/issues/478)
- Xcode Version Usage Survey [\#344](https://github.com/wix/detox/issues/344)
- Swipe Action Doesn't Work on RN ListView? [\#103](https://github.com/wix/detox/issues/103)

**Merged Pull Requests**

- RN Update Script v1.1 [\#610](https://github.com/wix/detox/pull/610) ([rotemmiz](https://github.com/rotemmiz))
- Improve iOS notifications dispatch timing [\#604](https://github.com/wix/detox/pull/604) ([LeoNatan](https://github.com/LeoNatan))
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

**Closed Issues**

- NSURLSession/NSURLConnection HTTP load failed \(kCFStreamErrorDomainSSL, -9806\) [\#558](https://github.com/wix/detox/issues/558)
- Help : Accessing third party components is possible with detox?   [\#552](https://github.com/wix/detox/issues/552)

**Merged Pull Requests**

- Minor typo in Introduction.GettingStarted.md [\#555](https://github.com/wix/detox/pull/555) ([orta](https://github.com/orta))
- Website build only run on master [\#544](https://github.com/wix/detox/pull/544) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [7.0.1](https://github.com/wix/detox/tree/7.0.1) (2018-01-29)
[Full Changelog](https://github.com/wix/detox/compare/7.0.0...7.0.1)

**Merged Pull Requests**

- Fixes broken AndroidDriver explicit exportGlobals flow [\#545](https://github.com/wix/detox/pull/545) ([rotemmiz](https://github.com/rotemmiz))

## [7.0.0](https://github.com/wix/detox/tree/7.0.0) (2018-01-26)
[Full Changelog](https://github.com/wix/detox/compare/v7.0.0-alpha.1...7.0.0)

**Closed Issues**

- Mocking push notifications on simulator [\#540](https://github.com/wix/detox/issues/540)
- Could not resolve project :detox [\#529](https://github.com/wix/detox/issues/529)

**Merged Pull Requests**

- export platform specific objects through proxy [\#374](https://github.com/wix/detox/pull/374) ([trofima](https://github.com/trofima))

## [v7.0.0-alpha.1](https://github.com/wix/detox/tree/v7.0.0-alpha.1) (2018-01-24)
[Full Changelog](https://github.com/wix/detox/compare/v7.0.0-alpha.0...v7.0.0-alpha.1)

**Fixed Bugs**

- Android test apk build path not aligned when using flavors [\#522](https://github.com/wix/detox/issues/522)

**Closed Issues**

- How to update to later version? [\#528](https://github.com/wix/detox/issues/528)
- Expect with atIndex\(\) not working !!!!! [\#523](https://github.com/wix/detox/issues/523)
- Select an image from a UIImagePickerController on iOS [\#508](https://github.com/wix/detox/issues/508)

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

- Code coverage reporting with other unit tests [\#470](https://github.com/wix/detox/issues/470)
- Add automatic code formatting via prettier [\#223](https://github.com/wix/detox/issues/223)

**Fixed Bugs**

- atIndex\(\) seems to be broken on Android [\#498](https://github.com/wix/detox/issues/498)
- Getting Started also requires adding babel-polyfill [\#481](https://github.com/wix/detox/issues/481)
- Test release on Android: app-release-androidTest.apk: No such file or directory [\#455](https://github.com/wix/detox/issues/455)
- Both Android and iOS e2e tests fail when following contribution guide [\#369](https://github.com/wix/detox/issues/369)
- Problems on Android using Jest test runner [\#362](https://github.com/wix/detox/issues/362)
- Detox failed to install apk files [\#274](https://github.com/wix/detox/issues/274)

**Closed Issues**

- Android gradle plugin 3.0.0 [\#503](https://github.com/wix/detox/issues/503)
- How to get position element? [\#476](https://github.com/wix/detox/issues/476)
- React Native + Mocha + Detox Can't Run Android Test [\#469](https://github.com/wix/detox/issues/469)
- Expect element to not exist timeout when the element doesn't exist. [\#464](https://github.com/wix/detox/issues/464)
- Can't locate the Header or the screen [\#460](https://github.com/wix/detox/issues/460)

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

**Closed Issues**

- is there any way can return the values from detox?  [\#443](https://github.com/wix/detox/issues/443)
- typeText stop the detox thread [\#441](https://github.com/wix/detox/issues/441)

**Merged Pull Requests**

- Add generation for tap at location [\#449](https://github.com/wix/detox/pull/449) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Generation: Remove unused helpers from generated code [\#448](https://github.com/wix/detox/pull/448) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Add prettier formatting for code generation [\#446](https://github.com/wix/detox/pull/446) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Fix several spelling typos [\#442](https://github.com/wix/detox/pull/442) ([sdg9](https://github.com/sdg9))
- Add support for generating android matchers [\#425](https://github.com/wix/detox/pull/425) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Add prettier to detox folder [\#278](https://github.com/wix/detox/pull/278) ([AlanFoster](https://github.com/AlanFoster))

## [6.0.2](https://github.com/wix/detox/tree/6.0.2) (2017-11-28)
[Full Changelog](https://github.com/wix/detox/compare/6.0.1...6.0.2)

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

- iOS: Earlgrey error after running the same `it\(\)` test twice [\#427](https://github.com/wix/detox/issues/427)
- How to post a http request in spec.js? [\#422](https://github.com/wix/detox/issues/422)
- Detox not working with iOS 9.3 [\#420](https://github.com/wix/detox/issues/420)
- Can we Install Detox on Windows Machine? If yes, can you provide me the Documentation? [\#417](https://github.com/wix/detox/issues/417)
- \[Android\] Guide to use UIAutomator for interacting with elements [\#416](https://github.com/wix/detox/issues/416)
- Animated Button block the Detox [\#414](https://github.com/wix/detox/issues/414)
- Keyboard issue [\#411](https://github.com/wix/detox/issues/411)

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

**Closed Issues**

- App will finish in timeout on splash screen [\#400](https://github.com/wix/detox/issues/400)
- Compatibility issues using jest [\#396](https://github.com/wix/detox/issues/396)
- Help on TypeText vs ReplaceText  [\#360](https://github.com/wix/detox/issues/360)
- assertWithMatcher:matcherForSufficientlyVisible if Connect Hardware Keyboard is disabled [\#336](https://github.com/wix/detox/issues/336)
- Detox Setup on Windows for Testing React Native Android Apps [\#333](https://github.com/wix/detox/issues/333)
- Detox Android test run : Cannot add task ':app:bundleAlphaDebugJsAndAssets' as a task with that name already exists [\#320](https://github.com/wix/detox/issues/320)
- Unable to match Text wrapped in Text [\#309](https://github.com/wix/detox/issues/309)
- Detect element existence without throwing an error [\#241](https://github.com/wix/detox/issues/241)
- Sample Travis CI config for Detox tests [\#202](https://github.com/wix/detox/issues/202)
- Multi layer screen, element not identified [\#188](https://github.com/wix/detox/issues/188)
- Tests hanging on before\_all hook  [\#155](https://github.com/wix/detox/issues/155)

## [5.10.1](https://github.com/wix/detox/tree/5.10.1) (2017-11-15)
[Full Changelog](https://github.com/wix/detox/compare/detox-server@2.1.0...5.10.1)

**Fixed Bugs**

- Can't get app launched via Detox [\#247](https://github.com/wix/detox/issues/247)

**Closed Issues**

- Unable to resolve dependecies [\#408](https://github.com/wix/detox/issues/408)
- Cannot click 'Done' on keyboard - solved [\#401](https://github.com/wix/detox/issues/401)
- How can I test my error handling? [\#399](https://github.com/wix/detox/issues/399)
- Retaining Redux state [\#331](https://github.com/wix/detox/issues/331)
- .multiTapAtPoint\(\) ? [\#314](https://github.com/wix/detox/issues/314)
- Hangs on `Searching for device matching iPhone 7...` [\#307](https://github.com/wix/detox/issues/307)

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

**Closed Issues**

- Simulator doesn't open after running Detox test [\#389](https://github.com/wix/detox/issues/389)
- Test without reinstalling the app [\#385](https://github.com/wix/detox/issues/385)
- Any way to make by.id work at describe block level? [\#384](https://github.com/wix/detox/issues/384)
- Detox hangs after failing test [\#383](https://github.com/wix/detox/issues/383)
- Travis CI Issues [\#382](https://github.com/wix/detox/issues/382)
- What are the changes to be done in to run detox tests\(demo-react-native\)with node version 6.9.1 [\#378](https://github.com/wix/detox/issues/378)
- how to test a spinner ? [\#377](https://github.com/wix/detox/issues/377)
- Detox core should not read --configuration name from argv directly [\#338](https://github.com/wix/detox/issues/338)

## [detox@5.9.3](https://github.com/wix/detox/tree/detox@5.9.3) (2017-11-02)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.9.2...detox@5.9.3)

**Closed Issues**

- Error: Could not find 'Nexus\_5\_API\_25' on the currently ADB attached devices [\#379](https://github.com/wix/detox/issues/379)
- First responder \[F\] of element \[E\] does not conform to UITextInput protocol [\#375](https://github.com/wix/detox/issues/375)
- Can't tap a Touchable [\#372](https://github.com/wix/detox/issues/372)
- ReferenceError: device is not defined - in init \(Detox: 5.9.2, Jest 21.1.2, RN 0.42.0\) [\#367](https://github.com/wix/detox/issues/367)
- "before all hook Timeout" \(RN 0.45.1, XCode 9.0.1, Detox 5.9.2\) [\#366](https://github.com/wix/detox/issues/366)
- Test Failures due to System Alert on CI--- Add retry [\#359](https://github.com/wix/detox/issues/359)
- Can't find device \<udid\> even though its loaded and available [\#358](https://github.com/wix/detox/issues/358)
- Timeout issues on CI [\#356](https://github.com/wix/detox/issues/356)
- Application crashes [\#354](https://github.com/wix/detox/issues/354)
- App crashes after installing [\#353](https://github.com/wix/detox/issues/353)
- XCode 9: Application crashes after tests are run \[libxpc.dylib + 69578\] [\#352](https://github.com/wix/detox/issues/352)
- Set Environment Variable [\#343](https://github.com/wix/detox/issues/343)
- Example of Using Contact Picker, Date Picker [\#332](https://github.com/wix/detox/issues/332)

**Merged Pull Requests**

- Move Detox.framework compilation to postinstall [\#373](https://github.com/wix/detox/pull/373) ([rotemmiz](https://github.com/rotemmiz))
- Add documentation for android unit tests [\#365](https://github.com/wix/detox/pull/365) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- improve android docs [\#361](https://github.com/wix/detox/pull/361) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Update Jest-related docs [\#355](https://github.com/wix/detox/pull/355) ([Kureev](https://github.com/Kureev))

## [detox@5.9.2](https://github.com/wix/detox/tree/detox@5.9.2) (2017-10-22)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.9.1...detox@5.9.2)

**Enhancements**

- Stop process and exit with error code 1 on fail [\#245](https://github.com/wix/detox/issues/245)

**Fixed Bugs**

- Application stopped at UIWindow creation while running tests on simulator [\#341](https://github.com/wix/detox/issues/341)

## [detox@5.9.1](https://github.com/wix/detox/tree/detox@5.9.1) (2017-10-19)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.9.0...detox@5.9.1)

**Closed Issues**

- Element Can't Find/Can't perform Action [\#290](https://github.com/wix/detox/issues/290)

**Merged Pull Requests**

- Re-add matcher generation commits and add traits matcher to generated code [\#348](https://github.com/wix/detox/pull/348) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [detox@5.9.0](https://github.com/wix/detox/tree/detox@5.9.0) (2017-10-18)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.8.4...detox@5.9.0)

**Enhancements**

- Missing command line dependencies should cause graceful failure [\#196](https://github.com/wix/detox/issues/196)
- Continue investigation of DetoxHelper [\#106](https://github.com/wix/detox/issues/106)

**Fixed Bugs**

- App launches but immediately closes [\#152](https://github.com/wix/detox/issues/152)

**Closed Issues**

- Screenshot and video test artifacts [\#349](https://github.com/wix/detox/issues/349)
- detox init - No such file or directory \(linux\) [\#346](https://github.com/wix/detox/issues/346)
- Crash after upgrading to 0.49 & CxxBridge [\#342](https://github.com/wix/detox/issues/342)
- Please add ability to write custom logs [\#118](https://github.com/wix/detox/issues/118)

**Merged Pull Requests**

- Add snapshot tests for matchers [\#347](https://github.com/wix/detox/pull/347) ([DanielMSchmidt](https://github.com/DanielMSchmidt))
- Create a build matrix to support multiple version of React Native and OSs [\#345](https://github.com/wix/detox/pull/345) ([rotemmiz](https://github.com/rotemmiz))
- Basic support for Jest runner [\#335](https://github.com/wix/detox/pull/335) ([Kureev](https://github.com/Kureev))

## [detox@5.8.4](https://github.com/wix/detox/tree/detox@5.8.4) (2017-10-17)
[Full Changelog](https://github.com/wix/detox/compare/detox-cli@1.0.3...detox@5.8.4)

## [detox-cli@1.0.3](https://github.com/wix/detox/tree/detox-cli@1.0.3) (2017-10-17)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.8.3...detox-cli@1.0.3)

**Fixed Bugs**

- Detox incompatibility with Firebase SDK [\#270](https://github.com/wix/detox/issues/270)

## [detox@5.8.3](https://github.com/wix/detox/tree/detox@5.8.3) (2017-10-16)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.8.2...detox@5.8.3)

**Closed Issues**

- "before all" hook Timeout exceeded when run the provided example test [\#340](https://github.com/wix/detox/issues/340)
- Android feedback [\#334](https://github.com/wix/detox/issues/334)

**Merged Pull Requests**

- Update README for required Xcode version [\#339](https://github.com/wix/detox/pull/339) ([MoOx](https://github.com/MoOx))

## [detox@5.8.2](https://github.com/wix/detox/tree/detox@5.8.2) (2017-10-12)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.8.1...detox@5.8.2)

**Enhancements**

- Integration with `jest` [\#143](https://github.com/wix/detox/issues/143)

**Fixed Bugs**

- xcode8 multiple sim windows after several launches [\#294](https://github.com/wix/detox/issues/294)
- std::\_\_1::bad\_function\_call \(crash when using RN \>= 0.48\) [\#279](https://github.com/wix/detox/issues/279)

**Closed Issues**

- Application crashes during the startup [\#328](https://github.com/wix/detox/issues/328)
- Detox with jest runner example [\#327](https://github.com/wix/detox/issues/327)
- typeText method is not working [\#326](https://github.com/wix/detox/issues/326)
- What is my test waiting on? [\#325](https://github.com/wix/detox/issues/325)
- React native app crashes with react-native versions 0.49 [\#324](https://github.com/wix/detox/issues/324)
- Prevent certain test specs from running temporarily [\#322](https://github.com/wix/detox/issues/322)
- The request was denied by service delegate [\#318](https://github.com/wix/detox/issues/318)
- Question: Why do we need to run a release build on the CI? [\#317](https://github.com/wix/detox/issues/317)
- Run only one \*.spec.js scenario ? [\#313](https://github.com/wix/detox/issues/313)
- Not working with React 16 // RN 0.48.4 [\#312](https://github.com/wix/detox/issues/312)
- Skip Emulator launcher on testing [\#311](https://github.com/wix/detox/issues/311)
- tap button only if exists [\#310](https://github.com/wix/detox/issues/310)
- Setting notifications permissions to yes on launching does not work anymore \(xcode 9, iOS 11\) [\#305](https://github.com/wix/detox/issues/305)
- detox test stuck at Searching for device matching iPhone \<model\> [\#304](https://github.com/wix/detox/issues/304)
- Detox test through ssh mount [\#286](https://github.com/wix/detox/issues/286)
- React Native 0.47.2 timeout issues [\#267](https://github.com/wix/detox/issues/267)

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

**Closed Issues**

- Hangs when typing text to an element [\#288](https://github.com/wix/detox/issues/288)
- Detox testing with Facebook Login [\#287](https://github.com/wix/detox/issues/287)
- App Terminated Immediately After install and start running - RN 0.48.3 [\#281](https://github.com/wix/detox/issues/281)

**Merged Pull Requests**

- High grade Android Emulator/Device control [\#295](https://github.com/wix/detox/pull/295) ([rotemmiz](https://github.com/rotemmiz))
- No more fb pains [\#292](https://github.com/wix/detox/pull/292) ([DanielZlotin](https://github.com/DanielZlotin))

## [detox@5.7.0](https://github.com/wix/detox/tree/detox@5.7.0) (2017-09-20)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.6.2...detox@5.7.0)

**Closed Issues**

- ReferenceError: \_\_DEV\_\_ is not defined when using async storage in Apollo client implementation [\#285](https://github.com/wix/detox/issues/285)
- ReferenceError: \_\_DEV\_\_ is not defined when using async storage in Apollo client implementation [\#284](https://github.com/wix/detox/issues/284)
- Assertion failed due to weird characters [\#283](https://github.com/wix/detox/issues/283)
- Cant install Detox using yarn [\#282](https://github.com/wix/detox/issues/282)
- fbsimctl installation issues [\#280](https://github.com/wix/detox/issues/280)
- Cant perform a simple click, getting timeout eventually [\#273](https://github.com/wix/detox/issues/273)
- Timeout with long-polling connection [\#272](https://github.com/wix/detox/issues/272)
- React Native Can't run detox tests [\#271](https://github.com/wix/detox/issues/271)
- TypeError: device.resetContentAndSettings is not a function [\#265](https://github.com/wix/detox/issues/265)

**Merged Pull Requests**

- Swift support [\#277](https://github.com/wix/detox/pull/277) ([rotemmiz](https://github.com/rotemmiz))

## [detox@5.6.2](https://github.com/wix/detox/tree/detox@5.6.2) (2017-09-09)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.6.1...detox@5.6.2)

**Fixed Bugs**

- Detox@5.6.1 npm@5.4.0 fails with Permission denied [\#259](https://github.com/wix/detox/issues/259)
- React Native demo project fails in debug mode [\#158](https://github.com/wix/detox/issues/158)

**Closed Issues**

- Mocking with react-native-repackager [\#269](https://github.com/wix/detox/issues/269)
- Cleaner Errors [\#266](https://github.com/wix/detox/issues/266)
- Error loading images with jest and detox [\#263](https://github.com/wix/detox/issues/263)
- Changing phone data or redux value while running E2E [\#262](https://github.com/wix/detox/issues/262)
- Time Stimulation for Testing [\#261](https://github.com/wix/detox/issues/261)
- Is there any support for "TOAST" message test. [\#260](https://github.com/wix/detox/issues/260)
- How to performing actions on browsers/another app/gallery/contacts etc. [\#258](https://github.com/wix/detox/issues/258)
- Cannot find element by disabled trait [\#256](https://github.com/wix/detox/issues/256)
- Run specific test spec [\#253](https://github.com/wix/detox/issues/253)
- Recommended testing approach for proxies [\#252](https://github.com/wix/detox/issues/252)
- Accessing External Areas to the App \(e.g. photo gallery\) [\#249](https://github.com/wix/detox/issues/249)
- clang: error: linker command failed with exit code 1 \(react-native-sentry issue\) [\#248](https://github.com/wix/detox/issues/248)
- Not possible to use `typeText` on the same element between multiple tests [\#239](https://github.com/wix/detox/issues/239)
- Getting Started @ Node 4.2.1: SyntaxError: Block-scoped declarations [\#234](https://github.com/wix/detox/issues/234)
- Supporting Android for E2E [\#232](https://github.com/wix/detox/issues/232)
- Quick hot reload possible?? [\#229](https://github.com/wix/detox/issues/229)
- Generated GREYAction JS wrapper uses unsupported variable types [\#228](https://github.com/wix/detox/issues/228)
- Safari callback [\#213](https://github.com/wix/detox/issues/213)

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

**Closed Issues**

- Importing device into test case [\#212](https://github.com/wix/detox/issues/212)
- TypeError: device.launchApp is not a function [\#211](https://github.com/wix/detox/issues/211)
- Is it possible to send "Done" or "Go" to the keyboard? [\#209](https://github.com/wix/detox/issues/209)

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

**Closed Issues**

- npm install detox@5.4.0 fails on windows 7 even though I have latest nodejs and npm [\#199](https://github.com/wix/detox/issues/199)
- How to use normal expect \(chai for example\) with detox? [\#198](https://github.com/wix/detox/issues/198)
- Confirming system messages [\#194](https://github.com/wix/detox/issues/194)
- How to tap on an action on actionsheet? [\#190](https://github.com/wix/detox/issues/190)

**Merged Pull Requests**

- Update APIRef.ActionsOnElement.md [\#203](https://github.com/wix/detox/pull/203) ([isnifer](https://github.com/isnifer))
- App logs [\#200](https://github.com/wix/detox/pull/200) ([silyevsk](https://github.com/silyevsk))
- Add support for tapAtPoint action [\#189](https://github.com/wix/detox/pull/189) ([blankg](https://github.com/blankg))

## [detox@5.4.0](https://github.com/wix/detox/tree/detox@5.4.0) (2017-07-11)
[Full Changelog](https://github.com/wix/detox/compare/detox-server@2.0.4...detox@5.4.0)

**Closed Issues**

- Not working expectation, action and waitFor during playing music [\#193](https://github.com/wix/detox/issues/193)
- Error: While installing 'fbsimctl' dependencies [\#192](https://github.com/wix/detox/issues/192)

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

- Using detox in a browfield context [\#187](https://github.com/wix/detox/issues/187)
- Page Object Pattern Suggestion [\#179](https://github.com/wix/detox/issues/179)
- replaceText does not trigger TextInput's onChangeText event [\#151](https://github.com/wix/detox/issues/151)

**Merged Pull Requests**

- Fix typo sre =\> are [\#185](https://github.com/wix/detox/pull/185) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [detox@5.3.0](https://github.com/wix/detox/tree/detox@5.3.0) (2017-07-04)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.2.0...detox@5.3.0)

**Closed Issues**

- Test for item within ListView [\#183](https://github.com/wix/detox/issues/183)
- `lerna run build` failing [\#182](https://github.com/wix/detox/issues/182)

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
[Full Changelog](https://github.com/wix/detox/compare/detox@5.1.0...detox@5.1.1)

**Merged Pull Requests**

- fixed the crash on older react native versions where there’s no `\_nod… [\#160](https://github.com/wix/detox/pull/160) ([silyevsk](https://github.com/silyevsk))

## [detox@5.1.0](https://github.com/wix/detox/tree/detox@5.1.0) (2017-06-07)
[Full Changelog](https://github.com/wix/detox/compare/detox-cli@1.0.2...detox@5.1.0)

## [detox-cli@1.0.2](https://github.com/wix/detox/tree/detox-cli@1.0.2) (2017-06-07)
[Full Changelog](https://github.com/wix/detox/compare/detox-server@2.0.3...detox-cli@1.0.2)

## [detox-server@2.0.3](https://github.com/wix/detox/tree/detox-server@2.0.3) (2017-06-07)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.12...detox-server@2.0.3)

**Enhancements**

- \[Question\] Select picker [\#139](https://github.com/wix/detox/issues/139)
- problems when using "waitFor" [\#138](https://github.com/wix/detox/issues/138)
- \[feature\] Add support for Orientation Change [\#131](https://github.com/wix/detox/issues/131)
- Test animation progress [\#130](https://github.com/wix/detox/issues/130)
- Android version [\#36](https://github.com/wix/detox/issues/36)

**Closed Issues**

- Does this work with Expo?  [\#147](https://github.com/wix/detox/issues/147)
- RNN issue with detox [\#142](https://github.com/wix/detox/issues/142)
- “run-server" is broken with yarn [\#141](https://github.com/wix/detox/issues/141)
- Fbsimctl issue on detox installation  [\#140](https://github.com/wix/detox/issues/140)
- WebView Matchers [\#136](https://github.com/wix/detox/issues/136)
- test fail with timeout [\#134](https://github.com/wix/detox/issues/134)
- \[feature\] Configurable Swipe guestures [\#128](https://github.com/wix/detox/issues/128)
- Try to type in different supported language [\#124](https://github.com/wix/detox/issues/124)
- Front end convention [\#87](https://github.com/wix/detox/issues/87)
- Detox scrolls warning area instead of real ListView [\#85](https://github.com/wix/detox/issues/85)
- expose a method that returns the hierarchy for a given element [\#76](https://github.com/wix/detox/issues/76)
- Potential flakiness issue with detox "should scroll for a small amount in direction" - travis failed [\#67](https://github.com/wix/detox/issues/67)

**Merged Pull Requests**

- Animations issue [\#150](https://github.com/wix/detox/pull/150) ([silyevsk](https://github.com/silyevsk))

## [detox@5.0.12](https://github.com/wix/detox/tree/detox@5.0.12) (2017-05-29)
[Full Changelog](https://github.com/wix/detox/compare/detox-server@2.0.2...detox@5.0.12)

## [detox-server@2.0.2](https://github.com/wix/detox/tree/detox-server@2.0.2) (2017-05-29)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.11...detox-server@2.0.2)

## [detox@5.0.11](https://github.com/wix/detox/tree/detox@5.0.11) (2017-05-29)
[Full Changelog](https://github.com/wix/detox/compare/detox-server@2.0.1...detox@5.0.11)

## [detox-server@2.0.1](https://github.com/wix/detox/tree/detox-server@2.0.1) (2017-05-29)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.10...detox-server@2.0.1)

**Closed Issues**

- Add ability to pass parameters to app [\#91](https://github.com/wix/detox/issues/91)

## [detox@5.0.10](https://github.com/wix/detox/tree/detox@5.0.10) (2017-05-28)
[Full Changelog](https://github.com/wix/detox/compare/detox-server@1.2.3...detox@5.0.10)

## [detox-server@1.2.3](https://github.com/wix/detox/tree/detox-server@1.2.3) (2017-05-28)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.9...detox-server@1.2.3)

**Closed Issues**

- Add support for React Native 0.44 [\#137](https://github.com/wix/detox/issues/137)
- Detox tests are flaky in CI [\#126](https://github.com/wix/detox/issues/126)

**Merged Pull Requests**

- Device Orientation Manipulation  [\#133](https://github.com/wix/detox/pull/133) ([DanielMSchmidt](https://github.com/DanielMSchmidt))

## [detox@5.0.9](https://github.com/wix/detox/tree/detox@5.0.9) (2017-05-24)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.8...detox@5.0.9)

**Enhancements**

- add app reuse option [\#46](https://github.com/wix/detox/issues/46)

**Closed Issues**

- demo-react-native : SyntaxError: Unexpected token \( [\#123](https://github.com/wix/detox/issues/123)
- Can't test custom keyboards [\#119](https://github.com/wix/detox/issues/119)
-  detox test - command doesn't work without additional params [\#111](https://github.com/wix/detox/issues/111)

**Merged Pull Requests**

- Update APIRef.Matchers.md [\#135](https://github.com/wix/detox/pull/135) ([isnifer](https://github.com/isnifer))
- Update APIRef.Element.md - fix broken links [\#125](https://github.com/wix/detox/pull/125) ([isnifer](https://github.com/isnifer))

## [detox@5.0.8](https://github.com/wix/detox/tree/detox@5.0.8) (2017-05-08)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.7...detox@5.0.8)

## [detox@5.0.7](https://github.com/wix/detox/tree/detox@5.0.7) (2017-05-07)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.6...detox@5.0.7)

**Closed Issues**

- detox init is not working [\#120](https://github.com/wix/detox/issues/120)
- Add detox to your package.json \(don't forget to switch 'example' with your project name\):  [\#110](https://github.com/wix/detox/issues/110)
- Missed command npm install [\#109](https://github.com/wix/detox/issues/109)
- Xcode configuratio are incorrect [\#108](https://github.com/wix/detox/issues/108)

**Merged Pull Requests**

- changed detox-init writeFileSync [\#122](https://github.com/wix/detox/pull/122) ([bogobogo](https://github.com/bogobogo))
- HW - Fix typos in README [\#121](https://github.com/wix/detox/pull/121) ([HanWax](https://github.com/HanWax))
- Update README.md [\#117](https://github.com/wix/detox/pull/117) ([dassir](https://github.com/dassir))

## [detox@5.0.6](https://github.com/wix/detox/tree/detox@5.0.6) (2017-04-20)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.5...detox@5.0.6)

**Closed Issues**

- Add a way to clean AsyncStorage [\#116](https://github.com/wix/detox/issues/116)
- testID after change get new values only after rebuild [\#102](https://github.com/wix/detox/issues/102)
- e2e get stuck [\#86](https://github.com/wix/detox/issues/86)
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

## [detox@5.0.5](https://github.com/wix/detox/tree/detox@5.0.5) (2017-03-23)
[Full Changelog](https://github.com/wix/detox/compare/detox-server@1.2.2...detox@5.0.5)

## [detox-server@1.2.2](https://github.com/wix/detox/tree/detox-server@1.2.2) (2017-03-23)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.4...detox-server@1.2.2)

**Enhancements**

- Create a CLI module [\#56](https://github.com/wix/detox/issues/56)
- Don't automatically install fbsimctl [\#47](https://github.com/wix/detox/issues/47)

**Fixed Bugs**

- Failing tests pass, afterEach fails [\#52](https://github.com/wix/detox/issues/52)

**Closed Issues**

- Error: Detox.framework not found [\#100](https://github.com/wix/detox/issues/100)
- output of `npm run test-install` does not show build failures [\#82](https://github.com/wix/detox/issues/82)
- dev scripts are broken [\#81](https://github.com/wix/detox/issues/81)
- rnpm link support [\#24](https://github.com/wix/detox/issues/24)
- Add mode to \_currentScheme [\#22](https://github.com/wix/detox/issues/22)
- Improve the demo-native shell script that copies binary outside [\#15](https://github.com/wix/detox/issues/15)

## [detox@5.0.4](https://github.com/wix/detox/tree/detox@5.0.4) (2017-03-17)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.3...detox@5.0.4)

## [detox@5.0.3](https://github.com/wix/detox/tree/detox@5.0.3) (2017-03-16)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.2...detox@5.0.3)

## [detox@5.0.2](https://github.com/wix/detox/tree/detox@5.0.2) (2017-03-16)
[Full Changelog](https://github.com/wix/detox/compare/detox@5.0.1...detox@5.0.2)

## [detox@5.0.1](https://github.com/wix/detox/tree/detox@5.0.1) (2017-03-16)
[Full Changelog](https://github.com/wix/detox/compare/detox-server@1.2.1...detox@5.0.1)

## [detox-server@1.2.1](https://github.com/wix/detox/tree/detox-server@1.2.1) (2017-03-16)
[Full Changelog](https://github.com/wix/detox/compare/detox-cli@1.0.1...detox-server@1.2.1)

## [detox-cli@1.0.1](https://github.com/wix/detox/tree/detox-cli@1.0.1) (2017-03-16)
[Full Changelog](https://github.com/wix/detox/compare/detox@4.3.2...detox-cli@1.0.1)

## [detox@4.3.2](https://github.com/wix/detox/tree/detox@4.3.2) (2017-03-09)
[Full Changelog](https://github.com/wix/detox/compare/detox@4.3.1...detox@4.3.2)

**Enhancements**

- Support es6 \(import, async await etc\) [\#62](https://github.com/wix/detox/issues/62)
- Refactor invoke queue into promise queue and support inline awaits [\#38](https://github.com/wix/detox/issues/38)

**Closed Issues**

- \[iOS\] Fail to type text with azerty Keyboard  [\#92](https://github.com/wix/detox/issues/92)
- initialUrl config option [\#90](https://github.com/wix/detox/issues/90)
- Test crashes simulator / testing hangs up. [\#84](https://github.com/wix/detox/issues/84)
- simulator.deleteAndRelaunchApp with fbsimctl is still slower than apple's [\#19](https://github.com/wix/detox/issues/19)

**Merged Pull Requests**

- Need to tap fb keg for fbsimctl install via homebrew [\#89](https://github.com/wix/detox/pull/89) ([brentvatne](https://github.com/brentvatne))

## [detox@4.3.1](https://github.com/wix/detox/tree/detox@4.3.1) (2017-02-26)
[Full Changelog](https://github.com/wix/detox/compare/detox@4.3.0...detox@4.3.1)

**Closed Issues**

- Simulate push notification [\#75](https://github.com/wix/detox/issues/75)
- Potential flakiness issue with detox 4 - Doron [\#66](https://github.com/wix/detox/issues/66)

**Merged Pull Requests**

- fix: ReferenceError: loglevel is not defined [\#88](https://github.com/wix/detox/pull/88) ([doronpr](https://github.com/doronpr))

## [detox@4.3.0](https://github.com/wix/detox/tree/detox@4.3.0) (2017-02-20)
[Full Changelog](https://github.com/wix/detox/compare/detox@4.2.0...detox@4.3.0)

## [detox@4.2.0](https://github.com/wix/detox/tree/detox@4.2.0) (2017-02-15)
[Full Changelog](https://github.com/wix/detox/compare/detox@4.1.4...detox@4.2.0)

**Closed Issues**

- improve error message if simulator not found [\#78](https://github.com/wix/detox/issues/78)
- fbsimctl sometimes fails with timeout on Travis CI [\#68](https://github.com/wix/detox/issues/68)
- Update the demo-native-ios to have the latest instructions in README [\#63](https://github.com/wix/detox/issues/63)

## [detox@4.1.4](https://github.com/wix/detox/tree/detox@4.1.4) (2017-01-19)
[Full Changelog](https://github.com/wix/detox/compare/detox@4.1.3...detox@4.1.4)

## [detox@4.1.3](https://github.com/wix/detox/tree/detox@4.1.3) (2017-01-19)
[Full Changelog](https://github.com/wix/detox/compare/detox@4.1.2...detox@4.1.3)

**Closed Issues**

- Unable to build the demo project [\#83](https://github.com/wix/detox/issues/83)

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

**Closed Issues**

- `npm run build` takes ages making development very difficult [\#79](https://github.com/wix/detox/issues/79)
- npm run build - builds the framework without any console messages [\#77](https://github.com/wix/detox/issues/77)

## [v4.1.0](https://github.com/wix/detox/tree/v4.1.0) (2017-01-17)
[Full Changelog](https://github.com/wix/detox/compare/4.0.12...v4.1.0)

**Closed Issues**

- multiple simulators open in tests if multiple sim versions installed \("iPhone 7 Plus"\) [\#80](https://github.com/wix/detox/issues/80)
- Navigation.startApp \(replacing root views\) fails the test [\#71](https://github.com/wix/detox/issues/71)
- Using firebase seems to cause detox to hang [\#70](https://github.com/wix/detox/issues/70)
- Command line arg to keep simulator open [\#55](https://github.com/wix/detox/issues/55)
- Add navigation support [\#54](https://github.com/wix/detox/issues/54)
- make "npm run e2e" work again [\#50](https://github.com/wix/detox/issues/50)

## [4.0.12](https://github.com/wix/detox/tree/4.0.12) (2017-01-10)
[Full Changelog](https://github.com/wix/detox/compare/1000...4.0.12)

**Closed Issues**

- Fast type text [\#64](https://github.com/wix/detox/issues/64)
- Remote testing [\#59](https://github.com/wix/detox/issues/59)

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

**Closed Issues**

- Add support in iOS alerts [\#53](https://github.com/wix/detox/issues/53)

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

- Add ability to enter type a text in a field [\#28](https://github.com/wix/detox/issues/28)
- role=testee not connected [\#25](https://github.com/wix/detox/issues/25)
- App freezes on launch [\#20](https://github.com/wix/detox/issues/20)
- Move fbsimctl to a different npm package \(detox-tools\) [\#18](https://github.com/wix/detox/issues/18)
- Create a simple npm script to fix EarlGrey build issues [\#16](https://github.com/wix/detox/issues/16)
- Handle NSLog better - output it during tests [\#14](https://github.com/wix/detox/issues/14)
- Support multiple test schemes - like Debug and Release [\#13](https://github.com/wix/detox/issues/13)
- react-native adds flakiness to tests due to its async nature [\#11](https://github.com/wix/detox/issues/11)
- simulator.relaunchApp is very slow [\#10](https://github.com/wix/detox/issues/10)
- RN release build fails in e2e due to sync problems [\#8](https://github.com/wix/detox/issues/8)
- Improve syncing between tester and testee by introducing isReady and ready [\#7](https://github.com/wix/detox/issues/7)
- FBSimCtl is very slow [\#6](https://github.com/wix/detox/issues/6)
- error trying to run e2e tests [\#4](https://github.com/wix/detox/issues/4)

**Merged Pull Requests**

- added match by type [\#40](https://github.com/wix/detox/pull/40) ([doronpr](https://github.com/doronpr))
- Added Tests of stressful conditions [\#21](https://github.com/wix/detox/pull/21) ([EtgarSH](https://github.com/EtgarSH))
- gitignore and npmignore fixes [\#17](https://github.com/wix/detox/pull/17) ([DanielZlotin](https://github.com/DanielZlotin))
- feat\(matchers\): fix typo [\#3](https://github.com/wix/detox/pull/3) ([ofirdagan](https://github.com/ofirdagan))
- log error when Detox.framework dlopen fails [\#2](https://github.com/wix/detox/pull/2) ([doronpr](https://github.com/doronpr))
- feat\(matchers\): add by id matcher [\#1](https://github.com/wix/detox/pull/1) ([ofirdagan](https://github.com/ofirdagan))



\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*