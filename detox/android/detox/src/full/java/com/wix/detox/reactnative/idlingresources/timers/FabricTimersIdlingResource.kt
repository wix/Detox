package com.wix.detox.reactnative.idlingresources.timers

import android.view.Choreographer
import androidx.test.espresso.IdlingResource
import com.facebook.react.bridge.ReactContext
import com.wix.detox.reactnative.idlingresources.DetoxIdlingResource

class FabricTimersIdlingResource(
    private val reactContext: ReactContext,
    private val getChoreographer: () -> Choreographer = { Choreographer.getInstance() }
) : DetoxIdlingResource(), Choreographer.FrameCallback {

    override fun checkIdle(): Boolean {
        val hasActiveTimers = JavaTimersReflected.hasActiveTimers(reactContext)

        if (hasActiveTimers) {
            getChoreographer().postFrameCallback(this@FabricTimersIdlingResource)
        } else {
            notifyIdle()
        }

        return !hasActiveTimers
    }

    override fun registerIdleTransitionCallback(callback: IdlingResource.ResourceCallback?) {
        super.registerIdleTransitionCallback(callback)
        getChoreographer().postFrameCallback(this)
    }

    override fun onUnregistered() {
        super.onUnregistered()
        getChoreographer().removeFrameCallback(this)
    }

    override fun getDebugName(): String {
        return "timers"
    }

    override fun getBusyHint(): Map<String, Any>? = null

    override fun getName(): String {
        return FabricTimersIdlingResource::class.java.name
    }



    override fun doFrame(frameTimeNanos: Long) {
        isIdleNow()
    }
}
