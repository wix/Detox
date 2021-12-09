<!-- markdownlint-configure-file { "first-line-heading": 0 } -->

<p align="center">
 <img alt="Detox" width=380 src="https://raw.githubusercontent.com/wix/Detox/master/docs/img/DetoxLogo.png"/>
</p>
<h1 align="center">
  Detox (Native)
</h1>
<p align="center">
  <b>Gray box end-to-end testing and automation library for mobile apps.</b>
</p>

**Detox-Native** is a subsidiary of the [Detox](https://github.com/wix/Detox) project. It is a work-in-progress, experimental initiative to bring all of Detox' under-the-hood magic for mobile app developers, typically writing UI tests using Google and Apple’s native go-to frameworks (e.g. Espresso, EarlGrey, XCTest).

**At the moment, the focus of the project is strictly on the Android platform.**

## Android

On Android, the project mostly aims to be an improvement over what we’ve found to be shortcomings in `Espresso`’s ability to produce stable and reliable UI tests. However, it also aims at offering additional interesting features.

**If you find Espresso unstable / unreliable, or are looking for some additional features, `Detox-Native` can help :muscle:**

Below is the set of actions Detox offers.

- [**Tap Gestures**](#tap-gestures): `tap()`, `doubleTap()`, `multiTap()`
- [**Gray-Box Scrolling:**](#gray-box-scrolling) `scrollDownBy()`, `scrollUpBy()`, `scrollLeftBy()`, `scrollRightBy()`

### Tap Gestures

#### Tap-Action Improvement

Detox offers a tap-action that is a more robust version of Espresso’s `ViewActions.click()` . Unlike Espresso’s `click()`, it performs the tap in a way that does not result in undesired long-taps, on occasions.

Usage example:

```diff
-onView(withId(R.id.fab)).perform(ViewActions.click())
+onView(withId(R.id.fab)).perform(DetoxViewActions.tap())
```

#### Double-Tap Improvement

Detox offers a double-tap gesture action that is a more robust version of Espresso’s `ViewActions.doubleClick()`. Detox’s implementation makes double-tapping very reliable, to the point where it would be very unlikely that the gesture would be registered as 2 separate taps (i.e. and would then not be caught by your crafted double-tap gesture handler in the app).

Usage example:

```diff
-onView(withId(R.id.knockKnock)).perform(ViewActions.doubleClick())
+onView(withId(R.id.knockKnock)).perform(DetoxViewActions.doubleTap())
```

#### Multi-Tap Gestures

Detox extends Espresso’s limited tapping gestures support, by providing an API for injecting a series of as many taps as you like, in a reliable way: The `multiTap(times)` method is what does this, and in fact, under the covers, `tap()` and `doubleTap()` are mere aliases of `multiTap(1)` and `multiTap(2)`, respectively.

Usage example:

```kotlin
onView(withId(R.id.easterEgg)).perform(DetoxViewActions.multiTap(5))
```

### Gray-Box Scrolling

Espresso’s [list actions API](https://developer.android.com/training/testing/espresso/lists) is highly comprehensive and very impressive. However, in some cases, what you’re really looking for is a simple Gray-box API that would just scroll a list by a certain amount of pixels (e.g. equivalent to an `N * item_height` formula):

```kotlin
onView(withId(R.id.feedMe)).perform(DetoxViewActions.scrollDownBy(100.0)) // 100 is in DP!
onView(withId(R.id.feedMe)).perform(DetoxViewActions.scrollUpBy(200.0))

onView(withId(R.id.avatars)).perform(DetoxViewActions.scrollRightBy(300.0))
onView(withId(R.id.avatars)).perform(DetoxViewActions.scrollLeftBy(400.0))
```

### Installation

In your app’s `build.gradle` - Add `Detox` as an android-test implementation dependency:

```groovy
dependencies {
  // ...  
  androidTestImplementation 'com.wix:detox:0.1.1'
}
```

In your root-project’s `build.gradle` - be sure to add `mavenCentral()` as an artifacts' repository:

```groovy
buildscript {
  repositories {
    // ...
    mavenCentral()
  }
}
```

> Note: Detox indirectly specifies Espresso and related dependencies - so best if you remove your own specification of them:
>
> ```diff
> -  androidTestImplementation 'androidx.test.ext:junit:1.1.2'
> -  androidTestImplementation 'androidx.test.espresso:espresso-core:3.3.0
> ```
