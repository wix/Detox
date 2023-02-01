v1.0.6
====
* Xcode 9 warning fixes [spekke]
* respondTo matcher checks for instancesRespondToSelector: too [dchohfi]

v1.0.5
=====
* Disables Bitcode on the Podspec  [jonakyd]
* Assign actual value to a strong variable in EXP_expect [StatusReport]
* Avoid holding matcher in the thread dictionary after matching. [StatusReport]
* Adds tvOS to the Podspec [orta]

v1.0.4
=====
* If descriptions match in an .equal() show the classes [orta + jorystiefel]

v1.0.3
=====
* Fixed an Xcode 7 deprecation warning [iosdev-republicofapps]

v1.0.2
=====
* Fixed a memory leak in the `expect()` block [dhardiman]

v1.0.1
=====
* Included EXPMatchers+match headers in public files [tonyarnold]

v1.0.0
======
* No changes

v0.4.2
======

* Fixes public header properties for EXPMatchers.h [robb]

v0.4.1
======

* Adds support for `match` for regular expressions [yomajkel] + [ashfurrow]

v0.4.0
======

* Adds `failure` syntax to force a test fail [orta]
* Fix potential selector conflicts [paulsamuels]

v0.3.2
======

* Adds support for Xcode/Apple LLVM 5.1, which means turning off Garbage Collection support [tonyarnold]
* Raises minimum deployment targets to iOS 5.x and OS X 10.7 [tonyarnold]
* Renamed `postNotification` to `notify` (with backwards compatability [gfontenot]
* `notify` equality isn't based on raw pointer equals [gfontenot]
* NSDecimalNumber & NSNumber comparison fixes [rolandkakonyi]
* Added support for `.after(2.5)` to allow a forced timeout [iabudiab]

v0.2.2
======

* Trigger a memory barrier when using `will` [jspahrsummers]
* Support for ARC when writing custom matchers [nickhutchinson]
* Ensure matcher category loading with constructors [robrix]
* haveCountOf supports any class that responds to `count` [segiddins][apparentsoft]

v0.2.1
======

* Added raiseWithReason matcher [blakewatters]
* Fixed crash when expecting a block [chrisdevereux]

v0.2.0
======

* New matcher syntax [TrahDivad]
* Extracted matcher functionality to its own class and protocol [lukeredpath]
* Dynamic predicate matchers [lukeredpath]
* raise/raiseAny matcher
* haveCountOf/beEmpty matcher [TrahDivad]
* contain matcher now handles any object that conforms to NSFastEnumeration [TrahDivad]
* Fixed false negative bug with async matchers [TrahDivad]

v0.1.3
======

* Fixed toBeSubClass matcher no longer working in iOS4
* Fixed minor bugs

v0.1.2
======

* Fixed toBeInstanceOf matcher not working with objects stored in an variable of type id
* Improved the formatting of NSSet objects in output

v0.1.1
======

* Improved the formatting of NSDictionary and NSArray objects in the output
* Improved handling of Class objects

v0.1.0
======

* First Cocoapods release
* toBeLessThan/toBeLessThanOrEqualTo/toBeGreaterThan/toBeGreaterThanOrEqualTo matchers [akitchen]
* toBeInTheRangeOf matcher [joncooper]
* Line-number highlighting in XCode [twobitlabs]
* Supports float/double tuples (e.g. CGPoint, CGRect) [kseebaldt]
