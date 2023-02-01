Master

v1.0.7
======

* Xcode9 compatability improvements - [shockdesign]
* SpectaDSL: dictionary objects' life time bug fix. - [mkimi-lightricks]

v1.0.6
======

* Log out when skipping a not-focused spec [orta]
* Fixed spt_dequeueFailures causing deadlock when running vanilla `XCTestCase` with `XCTestExpectation` [MatejBalantic]

v1.0.5
======
* Disables bitcode - [guidomb/timbodeit]
* Fixes a warning - [flovilmart]
* Adds tvOS to the Podspec - [orta]

v1.0.4
======

* Podspec Fix for `framework_search_paths`  [wessmith]
* makes specta compatible with xctool / xcode 7 [extrememan]

v1.0.3
======

* Fixed a retain cycle with example groups [dhardiman]

v1.0.2
======

* Added a `waitUntilTimeout` function allowing you to run a block with a specific timeout [eunikolsky]
* Support for Xcode 7 [coverback]

v1.0.1
======

* Made the framework iOS7 to fix a bug in generating Carthage compatible frameworks [hyperspacemark]

v1.0.0
======

* Minor cleanup to prepare for the first non-breakable release!

v0.5.0
=======

* BREAKING: Whitelist classes for inclusion in global beforeEach and afterEach hooks, instead of blacklisting for exclusion. See `SPTGlobalBeforeAfterEach` [wasnotrice]

v0.4.0
======
* Makes it easy to skip the beforeEach/afterEach functions for specific classes [paweldudek]
* All failures now call back on the main thread [neonacho + J-Rojas]
* ENV var to control signing [jmoody]
* Run Xcode command line tools with xcrun [jmoody]
* OCMock3 compatability [paweldudek]

v0.3.2
======

* Objective-C++ support

v0.3.1
======

* Xcode 6 / iOS 8 support.
* Option to shuffle tests. (Set environment variable `SPECTA_SHUFFLE` with value `1` to enable this feature.)
* BREAKING: `^AsyncBlock` is replaced by `waitUntil`. See example in the README for usage.

v0.2.1
======

* Workaround for Xcode truncating console output when tests run too quickly. [petejkim]

v0.2.0
======

* Added support for XCTest and dropped support for OCUnit (SenTestingKit). [petejkim]
* ARC [tonyarnold]
* Modern Objective-C syntax [tonyarnold]
* Fixed after hooks not running when an exception is raised in an example. [nerdyc]
* New nested custom reporter [nerdyc]

v0.1.11
=======

* Disable Async Testing when Specta is not compiled with Clang. [petejkim]
* Fixed failWithException: not passing thru to current test case. [rhgills]
* Fixed unused data dictionary crashing shared examples. [rhgills]
* Removed Warnings under LLVM GCC. [petejkim]
* Fixed release build not compiling due to implicitly synthesized properties. [kastiglione]

v0.1.10
=======

* Fixed Accessibility Inspector causing crash [wonga00]
* Fail when non-existent shared example is called [brow]

v0.1.9
======

* New Reporter [nerdyc]
* Focused Specs [nerdyc]
* Added PENDING macro for compatibility with Cedar-style pending specs. (Requires SPT\_CEDAR\_SYNTAX to be defined) [nerdyc]
* Xcode templates [nerdyc]
* Added Cedar-style global +beforeEach and +afterEach [petejkim]

v0.1.8
======

* Use atomic variables for async blocks [jspahrsummers]
* Fail instead of skipping when exceptions get thrown outside actual tests. [petejkim]
* itShouldBehaveLike should fail when called inside an it() block. [petejkim]

v0.1.7
======

* Async Testing [danpalmer]

v0.1.6
======

* Allow a custom subclass for test cases [joshabar]
* Xcode 4.4 fixes [jspahrsummers]
* Added a way to allow lazy evaluation of shared examples' context [petejkim]

v0.1.5
======

* Shared examples [petejkim]
* Sanitize description on exception [meiwin]

v0.1.4
======

* Pending specs [petejkim]
* Include SpectaTypes.h in the build output [strangemonad]

v0.1.3
======

* Fixed unexpected exceptions not being caught in iOS4 simulator [petejkim]
* Map unexpected exceptions to correct spec file [petejkim]

v0.1.2
======

* Fixed compiled example names being incorrectly generated [petejkim]

v0.1.1
======

* Prevented SPTSenTest class from running [petejkim]

v0.1.0
======

* First Release [petejkim]
