package com.wix.detox.reactnative.idlingresources.animations

import android.util.Log
import android.view.Choreographer
import androidx.test.espresso.IdlingResource.ResourceCallback
import com.facebook.react.animated.NativeAnimatedModule
import com.facebook.react.bridge.ReactContext
import com.wix.detox.reactnative.idlingresources.DetoxIdlingResource

private const val LOG_TAG = "Detox"


/**
 * Created by simonracz on 25/08/2017.
 */
/**
 *
 * Espresso IdlingResource for React Native's Animated Module.
 *
 *
 * Hooks up to React Native internals to monitor the state of the animations.
 *
 */
class AnimatedModuleIdlingResource(private val reactContext: ReactContext) : DetoxIdlingResource(),
    Choreographer.FrameCallback {

    override fun getName() = AnimatedModuleIdlingResource::class.java.name

    override fun getDebugName(): String {
        return "AnimatedModule"
    }

    override fun getBusyHint(): Map<String, Any> {
        return mapOf("reason" to "Animations running on screen")
    }

    override fun checkIdle(): Boolean {
        val animatedModule = reactContext.getNativeModule(NativeAnimatedModule::class.java)
        val hasAnimations = animatedModule?.nodesManager?.hasActiveAnimations() ?: false

        if (hasAnimations) {
            Log.i(LOG_TAG, "AnimatedModule is busy.")
            Choreographer.getInstance().postFrameCallback(this)
            return false
        }

        notifyIdle()
        return true
    }

    override fun registerIdleTransitionCallback(callback: ResourceCallback?) {
        super.registerIdleTransitionCallback(callback)
        Choreographer.getInstance().postFrameCallback(this)
    }

    override fun onUnregistered() {
        super.onUnregistered()
        Choreographer.getInstance().removeFrameCallback(this)
    }

    override fun doFrame(frameTimeNanos: Long) {
        isIdleNow
    }
}
