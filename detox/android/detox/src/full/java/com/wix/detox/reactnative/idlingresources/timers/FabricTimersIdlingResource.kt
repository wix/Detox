package com.wix.detox.reactnative.idlingresources.timers

import android.util.Log
import android.view.Choreographer
import androidx.test.espresso.IdlingResource
import com.facebook.react.bridge.ReactContext
import com.facebook.react.internal.AndroidChoreographerProvider.getChoreographer
import com.facebook.react.modules.core.JavaTimerManager
import com.wix.detox.reactnative.idlingresources.DetoxIdlingResource
import org.joor.Reflect
import kotlin.reflect.full.declaredFunctions
import kotlin.reflect.jvm.isAccessible

class FabricTimersIdlingResource(
    private val reactContext: ReactContext,
) : DetoxIdlingResource(), Choreographer.FrameCallback {

    override fun checkIdle(): Boolean {
        val hasActiveTimers: Boolean = hasActiveTimers()

        if (hasActiveTimers) {
            getChoreographer().postFrameCallback(this@FabricTimersIdlingResource)
        } else {
            notifyIdle()
        }

        return !hasActiveTimers
    }

    private fun hasActiveTimers(): Boolean {
        val timersManager = getTimersManager()
        val hasActiveTimersInRangeInstanceClass = timersManager::class
        val method = hasActiveTimersInRangeInstanceClass.declaredFunctions.first { it.name.contains("hasActiveTimersInRange") }
        method.isAccessible = true
        val hasActiveTimers: Boolean = method.call(timersManager, BUSY_WINDOW_THRESHOLD) as? Boolean ?: false
        return hasActiveTimers
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
