package com.wix.detox.reactnative.idlingresources

import androidx.test.espresso.IdlingResource
import com.wix.detox.espresso.idlingresources.DescriptiveIdlingResource
import java.util.concurrent.atomic.AtomicBoolean

abstract class DetoxIdlingResource : DescriptiveIdlingResource {
    private var callback: IdlingResource.ResourceCallback? = null
    private var paused: AtomicBoolean = AtomicBoolean(false)

    fun pause() {
        paused.set(true)
        notifyIdle()
    }

    fun resume() {
        paused.set(false)
    }


    override fun registerIdleTransitionCallback(callback: IdlingResource.ResourceCallback?) {
        this.callback = callback
    }

    final override fun isIdleNow(): Boolean {
        if (paused.get()) {
            return true
        }
        return checkIdle()
    }

    open fun onUnregistered() {
        // no-op
    }

    protected abstract fun checkIdle(): Boolean


    fun notifyIdle() {
        callback?.onTransitionToIdle()
    }
}
