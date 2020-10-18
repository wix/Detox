package com.wix.detox

import android.content.Context
import android.util.Log
import androidx.test.espresso.Espresso
import androidx.test.espresso.IdlingResource
import com.wix.detox.espresso.EspressoDetox
import com.wix.detox.espresso.UiAutomatorHelper
import com.wix.detox.reactnative.ReactNativeExtension

class TestEngineFacade {
    fun awaitIdle(): Unit? = Espresso.onIdle() {
        Log.i(Detox.LOG_TAG, "Wait is over: app is now idle!")
        null
    }
    fun syncIdle() = UiAutomatorHelper.espressoSync() // TODO Check whether this can be replaced with #awaitIdle()
    fun getBusyIdlingResources() = EspressoDetox.getBusyEspressoResources() as List<IdlingResource>
    fun reloadReactNative(appContext: Context) = ReactNativeExtension.reloadReactNative(appContext)
    fun resetReactNative() = ReactNativeExtension.clearAllSynchronization()
}
