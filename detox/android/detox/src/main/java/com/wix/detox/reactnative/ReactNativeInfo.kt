package com.wix.detox.reactnative

object ReactNativeInfo {
    fun isReactNativeApp(): Boolean = try {
        Class.forName("com.facebook.react.ReactApplication")
        true
    } catch (e: ClassNotFoundException) {
        false
    }
}
