package com.wix.detox.reactnative.idlingresources.timers

import android.view.Choreographer
import androidx.test.espresso.IdlingResource
import com.wix.detox.reactnative.idlingresources.DetoxBaseIdlingResource

class TimersIdlingResource @JvmOverloads constructor(
        private val interrogationStrategy: IdleInterrogationStrategy,
        private val getChoreographer: () -> Choreographer = { Choreographer.getInstance() }
    ) : DetoxBaseIdlingResource(), Choreographer.FrameCallback {

    private var callback: IdlingResource.ResourceCallback? = null

    override fun getName(): String = this.javaClass.name
    override fun getDescription(): String = "Enqueued timers"

    override fun registerIdleTransitionCallback(callback: IdlingResource.ResourceCallback?) {
        this.callback = callback
        getChoreographer().postFrameCallback(this)
    }

    override fun checkIdle(): Boolean {
        return interrogationStrategy.isIdleNow().also { result ->
            if (result) {
                notifyIdle()
            } else {
                getChoreographer().postFrameCallback(this@TimersIdlingResource)
            }
        }
    }

    override fun doFrame(frameTimeNanos: Long) {
        callback?.let {
            isIdleNow
        }
    }

    override fun notifyIdle() {
        callback?.onTransitionToIdle()
    }

    companion object {
        internal const val LOG_TAG = "TimersIdlingResource"
    }
}
