package com.wix.detox.reactnative.idlingresources.uimodule

import android.util.Log
import android.view.Choreographer
import androidx.test.espresso.IdlingResource.ResourceCallback
import com.facebook.react.bridge.ReactContext
import com.wix.detox.reactnative.helpers.RNHelpers
import com.wix.detox.reactnative.idlingresources.DetoxBaseIdlingResource
import org.joor.ReflectException

/**
 * Espresso IdlingResource for React Native's UI Module.
 * Hooks up to React Native internals to grab the pending ui operations from it.
 */
class UIModuleIdlingResource(private val reactContext: ReactContext)
    : DetoxBaseIdlingResource(), Choreographer.FrameCallback {

    private val rn66workaround = RN66Workaround()
    private val uiManagerModuleReflected = UIManagerModuleReflected(reactContext)
    private var callback: ResourceCallback? = null

    override fun getName(): String = UIModuleIdlingResource::class.java.name
    override fun getDebugName(): String = " ui"
    override fun getBusyHint(): Map<String, Any> {
        return mapOf("reason" to "UI rendering activity")
    }

    override fun checkIdle(): Boolean {
        try {
            if (!reactContext.hasActiveCatalystInstance()) {
                Log.e(LOG_TAG, "No active CatalystInstance. Should never see this.")
                return false
            }

            if (RNHelpers.getNativeModule(reactContext, "com.facebook.react.uimanager.UIManagerModule") == null) {
                notifyIdle()
                return true
            }

            val runnablesAreEmpty = uiManagerModuleReflected.isRunnablesListEmpty()
            val nonBatchesOpsEmpty = uiManagerModuleReflected.isNonBatchOpsEmpty()
            var operationQueueEmpty = uiManagerModuleReflected.isOperationQueueEmpty()

            if (!operationQueueEmpty) {
                operationQueueEmpty = rn66workaround.isScarceUISwitchCommandStuckInQueue(uiManagerModuleReflected)
            }

            if (runnablesAreEmpty && nonBatchesOpsEmpty && operationQueueEmpty) {
                notifyIdle()
                return true
            }

            Log.i(LOG_TAG, "UIManagerModule is busy")
            Choreographer.getInstance().postFrameCallback(this)
            return false
        } catch (e: ReflectException) {
            Log.e(LOG_TAG, "Can't set up RN UIModule listener", e.cause)
        }
        notifyIdle()
        return true
    }

    override fun registerIdleTransitionCallback(callback: ResourceCallback) {
        this.callback = callback
        Choreographer.getInstance().postFrameCallback(this)
    }

    override fun doFrame(frameTimeNanos: Long) {
        isIdleNow
    }

    override fun notifyIdle() {
        callback?.run {
            onTransitionToIdle()
        }
    }

    companion object {
        private const val LOG_TAG = "Detox"
    }
}
