package com.wix.detox.reactnative.idlingresources.timers

import android.annotation.SuppressLint
import android.view.Choreographer
import androidx.test.espresso.IdlingResource
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.TimingModule
import com.wix.detox.reactnative.idlingresources.DetoxIdlingResource

private const val BUSY_WINDOW_THRESHOLD = 1500L

class TimersIdlingResource @JvmOverloads constructor(
    reactContext: ReactContext,
    private val getChoreographer: () -> Choreographer = { Choreographer.getInstance() }
) : DetoxIdlingResource(), Choreographer.FrameCallback {

    private val timingModule: TimingModule = reactContext.getNativeModule(TimingModule::class.java)!!

    override fun getName(): String = this.javaClass.name
    override fun getDebugName(): String = "timers"
    override fun getBusyHint(): Map<String, Any>? = null

    override fun registerIdleTransitionCallback(callback: IdlingResource.ResourceCallback?) {
        super.registerIdleTransitionCallback(callback)
        getChoreographer().postFrameCallback(this)
    }

    @SuppressLint("VisibleForTests")
    override fun checkIdle(): Boolean {
        val isIdle = !timingModule.hasActiveTimersInRange(BUSY_WINDOW_THRESHOLD)

        if (isIdle) {
            notifyIdle()
        } else {
            getChoreographer().postFrameCallback(this)
        }

        return isIdle
    }

    override fun doFrame(frameTimeNanos: Long) {
        isIdleNow
    }

    companion object {
        internal const val LOG_TAG = "TimersIdlingResource"
    }
}
