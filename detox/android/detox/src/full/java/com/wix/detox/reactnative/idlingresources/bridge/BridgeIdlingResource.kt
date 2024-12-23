package com.wix.detox.reactnative.idlingresources.bridge

import android.util.Log
import com.facebook.react.bridge.NotThreadSafeBridgeIdleDebugListener
import com.facebook.react.bridge.ReactContext
import com.wix.detox.reactnative.idlingresources.DetoxIdlingResource
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Created by simonracz on 01/06/2017.
 */
/**
 *
 *
 * IdlingResource for Espresso, which monitors the traffic of
 * React Native's JS bridge.
 *
 */
class BridgeIdlingResource(private val reactContext: ReactContext) : DetoxIdlingResource(),
    NotThreadSafeBridgeIdleDebugListener {
    private val idleNow = AtomicBoolean(true)

    init {
        reactContext.catalystInstance.addBridgeIdleDebugListener(this)
    }

    fun onDetach() {
        reactContext.catalystInstance.removeBridgeIdleDebugListener(this)
    }

    override fun getName(): String {
        return BridgeIdlingResource::class.java.name
    }

    override fun getDebugName(): String {
        return "bridge"
    }

    override fun getBusyHint(): Map<String, Any>? {
        return null
    }

    override fun checkIdle(): Boolean {
        val ret = idleNow.get()
        if (!ret) {
            Log.i(LOG_TAG, "JS Bridge is busy")
        }
        return ret
    }

    override fun onTransitionToBridgeIdle() {
        idleNow.set(true)
        notifyIdle()
    }

    override fun onTransitionToBridgeBusy() {
        idleNow.set(false)
        // Log.i(LOG_TAG, "JS Bridge transitions to busy.");
    }

    override fun onBridgeDestroyed() {
    }

    override fun onUnregistered() {
        super.onUnregistered()
        onDetach()
    }

    companion object {
        private const val LOG_TAG = "Detox"
    }
}
