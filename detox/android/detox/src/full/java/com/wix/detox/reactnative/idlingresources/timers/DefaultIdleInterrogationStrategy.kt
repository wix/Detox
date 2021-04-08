@file:RNDropSupportTodo(62, "Remove all of this; Use DelegatedIdleInterrogationStrategy, instead.")

package com.wix.detox.reactnative.idlingresources.timers

import com.facebook.react.bridge.ReactContext
import com.wix.detox.common.RNDropSupportTodo
import com.wix.detox.reactnative.helpers.RNHelpers
import org.joor.Reflect
import java.util.*

private const val BUSY_WINDOW_THRESHOLD = 1500

private class TimerReflected(timer: Any) {
    private var reflected = Reflect.on(timer)

    val isRepeating: Boolean
        get() = reflected.field("mRepeat").get()
    val interval: Int
        get() = reflected.field("mInterval").get()
    val targetTime: Long
        get() = reflected.field("mTargetTime").get()
}

private class TimingModuleReflected(private val timingModule: Any) {
    val timersQueue: PriorityQueue<Any>
        get() = Reflect.on(timingModule).field("mTimers").get()
    val timersLock: Any
        get() = Reflect.on(timingModule).field("mTimerGuard").get()

    operator fun component1() = timersQueue
    operator fun component2() = timersLock
}

class DefaultIdleInterrogationStrategy
    internal constructor(private val timersModule: Any)
    : IdleInterrogationStrategy {

    override fun isIdleNow(): Boolean {
        val (timersQueue, timersLock) = TimingModuleReflected(timersModule)
        synchronized(timersLock) {
            val nextTimer = timersQueue.peek()
            nextTimer?.let {
                return !isTimerInBusyWindow(it) && !hasBusyTimers(timersQueue)
            }
            return true
        }
    }

    private fun isTimerInBusyWindow(timer: Any): Boolean {
        val timerReflected = TimerReflected(timer)
        return when {
            timerReflected.isRepeating -> false
            timerReflected.interval > BUSY_WINDOW_THRESHOLD -> false
            else -> true
        }
    }

    private fun hasBusyTimers(timersQueue: PriorityQueue<Any>): Boolean {
        timersQueue.forEach {
            if (isTimerInBusyWindow(it)) {
                return true
            }
        }
        return false
    }

    companion object {
        fun createIfSupported(reactContext: ReactContext): DefaultIdleInterrogationStrategy? {
            // RN = 0.62.0:
            // Should have been handled by DelegatedIdleInterrogationStrategy.createIfSupported() but seems the new TimingModule class
            // was released without the awaited-for "hasActiveTimersInRange()" method.
            try {
                val timingModule = RNHelpers.getNativeModule(reactContext, "com.facebook.react.modules.core.TimingModule")
                val timersManager = Reflect.on(timingModule).get<Any>("mJavaTimerManager")
                return DefaultIdleInterrogationStrategy(timersManager)
            } catch (ex: Exception) {
            }

            // RN < 0.62
            val timingModule = RNHelpers.getNativeModule(reactContext, "com.facebook.react.modules.core.Timing") ?: return null
            return DefaultIdleInterrogationStrategy(timingModule)
        }
    }
}
