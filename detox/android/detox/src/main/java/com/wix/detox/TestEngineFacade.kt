package com.wix.detox

import android.content.Context
import android.support.test.espresso.Espresso
import android.support.test.espresso.IdlingResource
import com.wix.detox.espresso.EspressoDetox
import com.wix.detox.espresso.UiAutomatorHelper

class TestEngineFacade {
    fun awaitIdle() = Espresso.onIdle()
    fun syncIdle() = UiAutomatorHelper.espressoSync() // TODO Check whether this can be replaced with #awaitIdle()
    fun getBusyIdlingResources() = EspressoDetox.getBusyEspressoResources() as List<IdlingResource>
    fun reloadReactNative(rnContext: Context) = ReactNativeSupport.reloadApp(rnContext)
    fun softResetReactNative() {
        ReactNativeSupport.currentReactContext = null
    }
    fun hardResetReactNative(context: Context) {
        softResetReactNative()
        ReactNativeSupport.removeEspressoIdlingResources(context)
    }
}
