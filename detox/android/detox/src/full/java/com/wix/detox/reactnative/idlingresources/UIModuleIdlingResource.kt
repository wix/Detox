package com.wix.detox.reactnative.idlingresources

import android.util.Log
import android.view.Choreographer
import androidx.test.espresso.IdlingResource.ResourceCallback
import com.facebook.react.bridge.ReactContext
import org.joor.ReflectException

/**
 * Espresso IdlingResource for React Native's UI Module.
 * Hooks up to React Native internals to grab the pending ui operations from it.
 */
class UIModuleIdlingResource(private val reactContext: ReactContext) : DetoxBaseIdlingResource(),
    Choreographer.FrameCallback {
    private var callback: ResourceCallback? = null
    private var rn66workaround: RN66Workaround? = null
    override fun getName(): String {
        return UIModuleIdlingResource::class.java.name
    }

    override fun getDescription(): IdlingResourceDescription {
        return IdlingResourceDescription.Builder()
            .name("ui")
            .addDescription("reason", "UI rendering activity")
            .build()
    }

    override fun checkIdle(): Boolean {
        try {
            val reactContextReflected = ReactContextReflected(reactContext)

            // reactContext.hasActiveCatalystInstance() should be always true here
            // if called right after onReactContextInitialized(...)
            if (reactContextReflected.getCatalystInstance() == null) {
                Log.e(LOG_TAG, "No active CatalystInstance. Should never see this.")
                return false
            }

            if (!reactContextReflected.hasNativeModule()) {
                notifyIdle()
                return true
            }

            val uiManagerModuleReflected = UIManagerModuleReflected(
                reactContext
            )
            val runnablesAreEmpty = uiManagerModuleReflected.getRunnablesAreEmpty()
            val nonBatchesOpsEmpty = uiManagerModuleReflected.getNonBatchOpsEmpty()
            var operationQueueEmpty = uiManagerModuleReflected.getOperationQueueEmpty()

            if (!operationQueueEmpty) {
                if (rn66workaround == null) {
                    rn66workaround = RN66Workaround()
                }
                operationQueueEmpty = rn66workaround!!.performWorkaround(uiManagerModuleReflected)
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
        if (callback != null) {
            callback!!.onTransitionToIdle()
        }
    }

    companion object {
        private const val LOG_TAG = "Detox"
    }
}