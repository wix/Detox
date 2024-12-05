package com.wix.detox.reactnative

import com.facebook.react.modules.systeminfo.ReactNativeVersion

data class RNVersion(val major: Int, val minor: Int, val patch: Int)

object ReactNativeInfo {
    private var rnVersion: RNVersion = ReactNativeVersion.VERSION.run {
        RNVersion(get("major") as Int, get("minor") as Int, get("patch") as Int)
    }

    @JvmStatic
    fun rnVersion() = rnVersion

    fun isReactNativeApp(): Boolean = try {
        Class.forName("com.facebook.react.ReactApplication")
        true
    } catch (e: ClassNotFoundException) {
        false
    }
}
