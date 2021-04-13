package com.wix.detox.reactnative.idlingresources.timers

import android.util.Log
import com.facebook.react.bridge.ReactContext
import com.wix.detox.common.UIThread
import java.util.concurrent.Callable

interface IdleInterrogationStrategy {
    fun isIdleNow(): Boolean
}

fun getInterrogationStrategy(reactContext: ReactContext): IdleInterrogationStrategy? =
    // Getting a native-module (inside) also initializes it if needed. That has to run on a
    // looper thread, and the easiest to make sure that happens is to use the main thread.
    UIThread.runSync(Callable {
        DelegatedIdleInterrogationStrategy.createIfSupported(reactContext)?.let {
            return@Callable it
        }

        DefaultIdleInterrogationStrategy.createIfSupported(reactContext)?.let {
            return@Callable it
        }

        Log.e(TimersIdlingResource.LOG_TAG, "Failed to determine proper implementation-strategy for timers idling resource")
        null
    })
