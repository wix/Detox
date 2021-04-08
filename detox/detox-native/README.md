<p align="center">
	<img alt="Detox" width=380 src="https://raw.githubusercontent.com/wix/Detox/master/docs/img/DetoxLogo.png"/>
</p>
<h1 align="center">
  Detox (Native)
</h1>
<p align="center">
  <b>Gray box end-to-end testing and automation library for mobile apps.</b>
</p>

**Detox-Native** is a subsidiary of the [Detox](https://github.com/wix/Detox) project. It is a work-in-progress, experimental initiative to bring all of Detox' under-the-hood magic for mobile app developers, typically writing UI tests using Google and Apple's native go-to frameworks (e.g. Espresso, EarlGrey, XCTest).

**At the moment, the focus of the project is strictly on the Android platform.**

## Android

On Android, the project mostly aims to be an improvement over what we've found to be shortcomings in `Espresso`'s ability to produce stable and reliable UI tests. However, it also aims at offering additional interesting features.

**If you find Espresso unstable / unreliable, or are looking for some additional features, give `Detox-Native` a try!**

### Features Set

Below are a few examples of what Detox offers for Android, at the moment (more to come, we hope!).

#### Tap-Action Improvement

Detox offers a tap-action that is essentially equivalent to Espresso's `ViewActions.click()` . However, it aims to perform the tap in a more robust way, that would not result in undesired long-taps, on occasions (as with Espresso's `click()`).

Usage example:

```kotlin
onView(withId(R.id.fab)).perform(DetoxViewActions.tap())
```

#### Double-Tap Improvement

Detox offers a double-tap gesture action equivalent to Espresso's `ViewActions.doubleClick()`. However, the implementation makes double-tapping very reliable, to the point where it would be very unlikely that the gesture would be registered as two separate taps (i.e. and would then not be caught by a crafted double-tap gesture handler in the app).

Usage example:

```kotlin
onView(withId(R.id.knockKnock)).perform(DetoxViewActions.doubleTap())
```

#### Multi-tap Gesture

Detox can inject a series of as many taps as you like, in a reliable way. In fact, `tap()` and `doubleTap()` a mere convience methods for using `multiTap(1)` and `multiTap(2)`, respectively.

Usage example:

```kotlin
onView(withId(R.id.easterEgg)).perform(DetoxViewActions.multiTap(5))
```

#### Take View Screenshots!

Detox can take screenshots of views, including all child-views in the view-hierarchy. Example of a resulted bitmap:

![Announcement View](../../docs/img/element-screenshot-view.png)

This can be very useful for screenshot-based snapshot tests, using external tools such as `applitools eyes`. It is a better approach than doing so with screenshots of the entire screen, as those include varying elements such as battery level, and time. Read more about it in our [Screenshots guide](../../docs/APIRef.Screenshots.md#element-level-screenshots-android-only).

Detox can provide the result screenshot as a bitmap, a byte-array, or a Base64-Encoded string (based on the raw byte-array). The byte-array approach is especially useful when using external services such as `applitools`, because this is normally the way the image can be uploaded there.

Usage example:

```kotlin
var bitmap: Bitmap?
var raw: ByteArray?
var base64: String?
onView(withId(R.id.announcement)).perform(DetoxViewActions.takeScreenshot().also { action ->
	action.getResult()?.let {
		bitmap = it.asBitmap()
		raw = it.asRawBytes()
		base64 = it.asBase64String()
	}
})
```

> To-do: add info about saving the image to a file.

### Installation

In your app's `build.gradle` - Add `Detox` as an android-test implementation dependency:

```groovy
dependencies {
  // ...  
  androidTestImplementation 'com.wix:detox:0.1.0'
}
```

In your root-project's `build.gradle` - be sure to add `mavenCentral()` as an artifacts repository:

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
> -  androidTestImplementation 'androidx.test.ext:junit:1.1.1'
> -  androidTestImplementation 'androidx.test.espresso:espresso-core:3.2.0
> ```

