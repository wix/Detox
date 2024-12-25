package com.wix.detox.reactnative.helpers

import android.util.Log
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactContext

private const val LOG_TAG = "DetoxRNHelpers"

object RNHelpers {
    fun getNativeModule(reactContext: ReactContext, className: String): NativeModule? =
        try {
            val moduleClass = Class.forName(className) as Class<NativeModule>
            reactContext.getNativeModule(moduleClass)
        } catch (ex: ClassNotFoundException) {
            Log.d(LOG_TAG, "Native RN module resolution (class $className): no such class")
            null
        }
}
