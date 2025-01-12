package com.wix.detox.reactnative.reloader

import android.app.Instrumentation
import com.facebook.react.ReactApplication
import com.wix.detox.reactnative.isFabricEnabled

class ReactNativeReloaderFactory(
    private val instrumentation: Instrumentation,
    private val rnApplication: ReactApplication
) {

    fun create(): ReactNativeReLoader {
        return when {
            isFabricEnabled() -> NewArchitectureNativeReLoader(instrumentation, rnApplication)
            else -> OldArchReactNativeReLoader(instrumentation, rnApplication)
        }
    }
}
