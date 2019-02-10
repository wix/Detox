package com.wix.detox

import android.content.Context
import android.support.test.espresso.Espresso
import com.wix.detox.espresso.UiAutomatorHelper

class ActionsFacade {
    fun awaitIdle() = Espresso.onIdle()
    fun syncIdle() = UiAutomatorHelper.espressoSync() // TODO Check whether this can be replaced with #awaitIdle()
    fun reloadReactNative(rnContext: Context) = ReactNativeSupport.reloadApp(rnContext)
}
