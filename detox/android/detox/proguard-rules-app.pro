-keepattributes InnerClasses, Exceptions

-keep class com.facebook.react.modules.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.animated.** { *; }
-keep class com.facebook.react.ReactApplication { *; }
-keep class com.facebook.react.ReactNativeHost { *; }
-keep class com.facebook.react.ReactInstanceManager { *; }
-keep class com.facebook.react.ReactInstanceManager** { *; }
-keep class com.facebook.react.ReactInstanceEventListener { *; }

-keep class com.facebook.react.views.slider.** { *; }
-keep class com.google.android.material.slider.** { *; }
-keep class com.reactnativecommunity.slider.** { *; }
-keep class com.reactnativecommunity.asyncstorage.** { *; }

-keep class kotlin.jvm.** { *; }
-keep class kotlin.collections.** { *; }
-keep class kotlin.text.** { *; }
-keep class kotlin.io.** { *; }
-keep class okhttp3.** { *; }

-keep class androidx.concurrent.futures.** { *; }

-dontwarn androidx.appcompat.**
-dontwarn javax.lang.model.element.**

