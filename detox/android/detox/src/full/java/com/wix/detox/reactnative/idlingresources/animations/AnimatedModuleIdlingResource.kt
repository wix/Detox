package com.wix.detox.reactnative.idlingresources.animations

import android.util.Log
import android.view.Choreographer
import androidx.annotation.UiThread
import androidx.test.espresso.IdlingResource.ResourceCallback
import com.facebook.react.animated.NativeAnimatedModule
import com.facebook.react.animated.NativeAnimatedNodesManager
import com.facebook.react.bridge.ReactContext
import com.wix.detox.common.DetoxErrors
import com.wix.detox.common.DetoxLog.Companion.LOG_TAG
import com.wix.detox.reactnative.idlingresources.DetoxIdlingResource
import kotlin.reflect.full.memberFunctions
import kotlin.reflect.full.memberProperties
import kotlin.reflect.jvm.isAccessible

class AnimatedModuleIdlingResource(private val reactContext: ReactContext) : DetoxIdlingResource(),
    Choreographer.FrameCallback {

    private var animatedModule: AnimatedModuleFacade? = null

    override fun getName(): String = AnimatedModuleIdlingResource::class.java.name
    override fun getDebugName() = "ui"
    override fun getBusyHint(): Map<String, Any> = mapOf("reason" to "Animations running on screen")

    override fun checkIdle(): Boolean {
        val animatedModule = getAnimatedModule()
        if (animatedModule == null) {
            Log.w(LOG_TAG, "AnimatedModule is idle because the native-module is not available")
            return false
        }

        if (animatedModule.hasQueuedAnimations() ||
            animatedModule.hasActiveAnimations()) {
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

    private fun getAnimatedModule(): AnimatedModuleFacade? =
         if (animatedModule != null) {
            animatedModule
        } else {
            reactContext.getNativeModule(NativeAnimatedModule::class.java)?.let {
                AnimatedModuleFacade(it).also { nativeModule ->
                    animatedModule = nativeModule
                }
            }
        }
}

private class AnimatedModuleFacade(private val animatedModule: NativeAnimatedModule) {
    private val operationsQueue: OperationsQueueReflected
    private val preOperationsQueue: OperationsQueueReflected
    private val nodesManager: NativeAnimatedNodesManager

    init {
        operationsQueue = (NativeAnimatedModule::class.memberProperties.find { it.name == "mOperations" } ?:
            throw DetoxErrors.DetoxIllegalStateException("mOperations property cannot be accessed")).let {

                it.isAccessible = true
                OperationsQueueReflected(it.get(animatedModule) as Any)
            }

        preOperationsQueue = (NativeAnimatedModule::class.memberProperties.find { it.name == "mPreOperations" } ?:
            throw DetoxErrors.DetoxIllegalStateException("mPreOperations property cannot be accessed")).let {

                it.isAccessible = true
                OperationsQueueReflected(it.get(animatedModule) as Any)
            }

        nodesManager = animatedModule.nodesManager ?:
            throw DetoxErrors.DetoxIllegalStateException("AnimatedModule exists but nodesManager is null")
    }

    @UiThread
    fun hasQueuedAnimations(): Boolean =
        !preOperationsQueue.isEmpty() ||
        !operationsQueue.isEmpty()

    @UiThread
    fun hasActiveAnimations(): Boolean {
        return nodesManager.hasActiveAnimations()
    }
}

class OperationsQueueReflected(private val operationsQueue: Any) {
    fun isEmpty(): Boolean {
        val isEmptyMethod = operationsQueue::class.memberFunctions.find { it.name == "isEmpty" } ?:
            throw DetoxErrors.DetoxIllegalStateException("isEmpty method cannot be reached")

        isEmptyMethod.isAccessible = true
        return isEmptyMethod.call(operationsQueue) as Boolean
    }
}
