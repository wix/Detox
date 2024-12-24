@file:Suppress("INVISIBLE_MEMBER", "INVISIBLE_REFERENCE")

package com.wix.detox.reactnative.idlingresources.timers

import android.view.Choreographer
import androidx.test.espresso.IdlingResource
import com.facebook.react.bridge.ReactContext
import com.facebook.react.internal.AndroidChoreographerProvider.getChoreographer
import com.facebook.react.modules.core.JavaTimerManager
import com.wix.detox.reactnative.idlingresources.DetoxIdlingResource
import org.joor.Reflect

class FabricTimersIdlingResource(
    private val reactContext: ReactContext,
) : DetoxIdlingResource(), Choreographer.FrameCallback {

    override fun checkIdle(): Boolean {
        val hasActiveTimers = getTimersManager().hasActiveTimersInRange(BUSY_WINDOW_THRESHOLD)

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

    override fun getDebugName(): String {
        return "FabricTimers"
    }

    override fun getBusyHint(): Map<String, Any>? = null

    override fun getName(): String {
        return FabricTimersIdlingResource::class.java.name
    }

    private fun getTimersManager(): JavaTimerManager {
        val reactHost = Reflect.on(reactContext).field("mReactHost").get<Any>()
        val reactInstance = Reflect.on(reactHost).field("mReactInstance").get<Any>()
        return Reflect.on(reactInstance).field("mJavaTimerManager").get() as JavaTimerManager
    }

    override fun doFrame(frameTimeNanos: Long) {
        isIdleNow()
    }
}
