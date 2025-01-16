package com.wix.detox.reactnative.idlingresources.uimodule.paper

import android.util.Log
import android.view.Choreographer
import androidx.test.espresso.IdlingResource
import com.facebook.react.bridge.ReactContext
import com.wix.detox.reactnative.helpers.RNHelpers
import com.wix.detox.reactnative.idlingresources.DetoxIdlingResource
import org.joor.ReflectException

/**
 * Espresso IdlingResource for React Native's UI Module.
 * Hooks up to React Native internals to grab the pending ui operations from it.
 */
class UIModuleIdlingResource(private val reactContext: ReactContext)
    : DetoxIdlingResource(), Choreographer.FrameCallback {

    private val uiManagerModuleReflected = UIManagerModuleReflected(reactContext)

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

            if (RNHelpers().getNativeModule(
                    reactContext,
                    "com.facebook.react.uimanager.UIManagerModule"
                ) == null) {
                notifyIdle()
                return true
            }

            val runnablesAreEmpty = uiManagerModuleReflected.isRunnablesListEmpty()
            val nonBatchesOpsEmpty = uiManagerModuleReflected.isNonBatchOpsEmpty()
            val operationQueueEmpty = uiManagerModuleReflected.isOperationQueueEmpty()

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

    override fun registerIdleTransitionCallback(callback: IdlingResource.ResourceCallback?) {
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

    companion object {
        private const val LOG_TAG = "Detox"
    }
}
