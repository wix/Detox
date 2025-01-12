package com.wix.detox.reactnative.idlingresources

import androidx.annotation.VisibleForTesting
import androidx.test.espresso.IdlingResource
import com.wix.detox.espresso.idlingresources.DescriptiveIdlingResource
import java.util.concurrent.atomic.AtomicBoolean

abstract class DetoxIdlingResource : DescriptiveIdlingResource {
    private var callback: IdlingResource.ResourceCallback? = null
    @VisibleForTesting
    internal var paused: AtomicBoolean = AtomicBoolean(false)

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
        // First thing to do is to pause the resource in order to insure that it won't be called again when it's not registered.
        pause()
    }

    protected abstract fun checkIdle(): Boolean


    fun notifyIdle() {
        callback?.onTransitionToIdle()
    }
}
