package com.wix.detox.espresso

import android.support.test.espresso.IdlingResource
import android.view.Choreographer
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.Timing
import org.joor.Reflect
import java.util.*
import java.util.concurrent.atomic.AtomicBoolean

const val BUSY_WINDOW_THRESHOLD = 1500

class TimerReflected(timer: Any) {
    private var reflected = Reflect.on(timer)

    val isRepeating: Boolean
        get() = reflected.field("mRepeat").get()

    val interval: Int
        get() = reflected.field("mInterval").get()

    val targetTime: Long
        get() = reflected.field("mTargetTime").get()
}

class TimingModuleReflected(reactContext: ReactContext) {
    private var nativeModule = reactContext.getNativeModule(Timing::class.java)

    val timersQueue: PriorityQueue<Any>
        get() = Reflect.on(nativeModule).field("mTimers").get()

    val timersLock: Object
        get() = Reflect.on(nativeModule).field("mTimerGuard").get()

    operator fun component1() = timersQueue
    operator fun component2() = timersLock
}

class ReactNativeTimersIdlingResource @JvmOverloads constructor(
        private val reactContext: ReactContext,
        private val getChoreographer: () -> Choreographer = { Choreographer.getInstance() }
    ) : IdlingResource, Choreographer.FrameCallback {

    private var callback: IdlingResource.ResourceCallback? = null
    private var paused = AtomicBoolean(false)

    override fun getName(): String = this.javaClass.name

    override fun registerIdleTransitionCallback(callback: IdlingResource.ResourceCallback?) {
        this.callback = callback
        getChoreographer().postFrameCallback(this)
    }

    override fun isIdleNow(): Boolean {
        if (paused.get()) {
            return true
        }

        return checkIdle().apply {
            val result = this
            if (result) {
                callback?.onTransitionToIdle()
            } else {
                getChoreographer().postFrameCallback(this@ReactNativeTimersIdlingResource)
            }
        }
    }

    override fun doFrame(frameTimeNanos: Long) {
        callback?.let {
            isIdleNow
        }
    }

    public fun pause() {
        paused.set(true)
        callback?.onTransitionToIdle()
    }

    public fun resume() {
        paused.set(false)
    }

    private fun checkIdle(): Boolean {
        val now = System.nanoTime() / 1000000L
        val (timersQueue, timersLock) = TimingModuleReflected(reactContext)

        synchronized(timersLock) {
            val nextTimer = timersQueue.peek()
            nextTimer?.let {
                return !isTimerInBusyWindow(it, now) && !hasBusyTimers(timersQueue, now)
            }
            return true
        }
    }

    private fun isTimerInBusyWindow(timer: Any, now: Long): Boolean {
        val timerReflected = TimerReflected(timer)
        return when {
            timerReflected.isRepeating -> false
            timerReflected.targetTime < now -> false
            timerReflected.interval > BUSY_WINDOW_THRESHOLD -> false
            else -> true
        }
    }

    private fun hasBusyTimers(timersQueue: PriorityQueue<Any>, now: Long): Boolean {
        timersQueue.forEach {
            if (isTimerInBusyWindow(it, now)) {
                return true
            }
        }
        return false
    }
}
