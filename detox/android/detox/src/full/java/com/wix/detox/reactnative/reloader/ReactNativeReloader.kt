package com.wix.detox.reactnative.reloader

import android.app.Instrumentation
import com.facebook.react.ReactApplication

interface ReactNativeReLoader {
    fun reloadInBackground()
}

class OldArchReactNativeReLoader(
        private val instrumentation: Instrumentation,
        private val rnApplication: ReactApplication
) : ReactNativeReLoader {

    override fun reloadInBackground() {
        val rnInstanceManager = rnApplication.reactNativeHost.reactInstanceManager
        instrumentation.runOnMainSync {
            rnInstanceManager.recreateReactContextInBackground()
        }
    }
}

class NewArchitectureNativeReLoader(
    private val instrumentation: Instrumentation,
    private val rnApplication: ReactApplication
) : ReactNativeReLoader {
    override fun reloadInBackground() {
        val reactHost = rnApplication.reactHost
        instrumentation.runOnMainSync {
            reactHost?.reload("Detox")
        }
    }
}
