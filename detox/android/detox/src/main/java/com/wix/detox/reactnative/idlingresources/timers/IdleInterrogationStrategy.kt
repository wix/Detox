package com.wix.detox.reactnative.idlingresources.timers

import android.util.Log
import com.facebook.react.bridge.ReactContext

interface IdleInterrogationStrategy {
    fun isIdleNow(): Boolean
}

fun getInterrogationStrategy(reactContext: ReactContext): IdleInterrogationStrategy? {
    DelegatedIdleInterrogationStrategy.createIfSupported(reactContext)?.let {
        return it
    }

    DefaultIdleInterrogationStrategy.createIfSupported(reactContext)?.let {
        return it
    }

    Log.e(TimersIdlingResource.LOG_TAG, "Failed to determine proper implementation-strategy for timers idling resource")
    return null
}
