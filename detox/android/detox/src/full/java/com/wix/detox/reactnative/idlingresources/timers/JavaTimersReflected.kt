package com.wix.detox.reactnative.idlingresources.timers

import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.JavaTimerManager
import org.joor.Reflect
import kotlin.reflect.full.declaredFunctions
import kotlin.reflect.jvm.isAccessible

object JavaTimersReflected {

    fun hasActiveTimers(reactContext: ReactContext): Boolean {
        val timersManager = getTimersManager(reactContext)
        val hasActiveTimersInRangeInstanceClass = timersManager::class
        val method =
            hasActiveTimersInRangeInstanceClass.declaredFunctions.first { it.name.contains("hasActiveTimersInRange") }
        method.isAccessible = true
        val hasActiveTimers: Boolean = method.call(timersManager, BUSY_WINDOW_THRESHOLD) as? Boolean ?: false
        return hasActiveTimers
    }

    private fun getTimersManager(reactContext: ReactContext): JavaTimerManager {
        val reactHost = Reflect.on(reactContext).field("mReactHost").get<Any>()
        val reactInstance = Reflect.on(reactHost).field("mReactInstance").get<Any>()
        return Reflect.on(reactInstance).field("mJavaTimerManager").get() as JavaTimerManager
    }
}
