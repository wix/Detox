package com.wix.detox.reactnative.idlingresources.timers

import android.view.Choreographer
import androidx.test.espresso.IdlingResource
import java.util.concurrent.atomic.AtomicBoolean

class TimersIdlingResource @JvmOverloads constructor(
        private val interrogationStrategy: IdleInterrogationStrategy,
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

        return checkIdle().also { result ->
            if (result) {
                callback?.onTransitionToIdle()
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

    fun pause() {
        paused.set(true)
        callback?.onTransitionToIdle()
    }

    fun resume() {
        paused.set(false)
    }

    private fun checkIdle() = interrogationStrategy.isIdleNow()

    companion object {
        const val LOG_TAG = "TimersIdlingResource"
    }
}
