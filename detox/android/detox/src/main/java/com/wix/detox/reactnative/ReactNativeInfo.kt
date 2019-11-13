package com.wix.detox.reactnative

import org.joor.Reflect

data class RNVersion(val major: Int, val minor: Int, val patch: Int)

object ReactNativeInfo {
    private var rnVersion: RNVersion =
            try {
                val versionClass = Class.forName("com.facebook.react.modules.systeminfo.ReactNativeVersion")
                val versionMap: Map<String, Int> = Reflect.on(versionClass).field("VERSION").get()
                RNVersion(versionMap.getValue("major"), versionMap.getValue("minor"), versionMap.getValue("patch"))
            } catch (e: ClassNotFoundException) {
                // ReactNativeVersion was introduced in RN50, default to latest previous version.
                RNVersion(0, 49, 0)
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
