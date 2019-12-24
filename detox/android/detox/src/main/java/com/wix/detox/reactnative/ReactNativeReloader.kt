package com.wix.detox.reactnative

import android.app.Instrumentation
import com.facebook.react.ReactApplication

open class ReactNativeReLoader(
        private val instrumentation: Instrumentation,
        private val rnApplication: ReactApplication) {

    fun reloadInBackground() {
        val rnInstanceManager = rnApplication.reactNativeHost.reactInstanceManager
        instrumentation.runOnMainSync {
            rnInstanceManager.recreateReactContextInBackground()
        }
    }
}
