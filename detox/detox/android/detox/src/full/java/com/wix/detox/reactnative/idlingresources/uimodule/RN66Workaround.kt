package com.wix.detox.reactnative.idlingresources.uimodule

import android.util.Log
import android.view.View
import com.facebook.react.uimanager.IllegalViewOperationException
import com.wix.detox.common.DetoxLog.Companion.LOG_TAG
import com.wix.detox.reactnative.ReactNativeInfo
import java.lang.ref.WeakReference

private const val NUM_TIMES_BEFORE_NOTIFY_IDLE = 10
private const val SET_NATIVE_VALUE = "setNativeValue"
private const val CLASS_REACT_SWITCH = "com.facebook.react.views.switchview.ReactSwitch"

class RN66Workaround {
    private var timesStuckQueueDetected = 0
    private var stuckOperation: WeakReference<Any?>? = null

    // This is a workaround for https://github.com/facebook/react-native/issues/32594
    // uses duck typing heuristics to determine that this is probably the stuck Switch operation and if so, ignores it
    fun isScarceUISwitchCommandStuckInQueue(uiManagerModuleReflected: UIManagerModuleReflected): Boolean {
        var isStuckSwitchOperation = false

        if (isRelevantRNVersion() && uiManagerModuleReflected.getUIOpsCount() >= 1) {
            val nextUIOperation = uiManagerModuleReflected.getNextUIOpReflected()
            val view = getUIOpView(uiManagerModuleReflected, nextUIOperation)
            val isReactSwitch = isReactSwitch(view)
            val hasOneRetryIncremented = nextUIOperation?.numRetries == 1
            val isSetNativeValueCommand = (nextUIOperation?.viewCommand ?: "") == SET_NATIVE_VALUE

            if (isReactSwitch && hasOneRetryIncremented && isSetNativeValueCommand) {
                if (stuckOperation?.get() == nextUIOperation?.instance) {
                    timesStuckQueueDetected++
                } else {
                    stuckOperation = WeakReference(nextUIOperation?.instance)
                    timesStuckQueueDetected = 0
                }
            }

            if (timesStuckQueueDetected >= NUM_TIMES_BEFORE_NOTIFY_IDLE) {
                isStuckSwitchOperation = true
            }
        } else {
            timesStuckQueueDetected = 0
        }
        return isStuckSwitchOperation
    }

    private fun isRelevantRNVersion(): Boolean {
        val rnVersion = ReactNativeInfo.rnVersion()
        return rnVersion.minor == 66 || (rnVersion.minor == 67 && rnVersion.patch < 4)
    }

    private fun getUIOpView(uiManagerModuleReflected: UIManagerModuleReflected, uiOperation: DispatchCommandOperationReflected?): View? {
        val nativeViewHierarchyManager = uiManagerModuleReflected.nativeViewHierarchyManager() ?: return null
        val tag = uiOperation?.tag ?: return null
        return try {
            nativeViewHierarchyManager.getViewClass(tag)
        } catch(e: IllegalViewOperationException) {
            Log.e(LOG_TAG, "failed to get view from tag ", e.cause)
            null
        }
    }

    private fun isReactSwitch(view: View?) = try {
        val ReactSwitchClass: Class<*> = Class.forName(CLASS_REACT_SWITCH)
        if (view != null) ReactSwitchClass.isAssignableFrom(view.javaClass) else false
    } catch (e: ClassNotFoundException) {
        Log.e(LOG_TAG, "failed to get $CLASS_REACT_SWITCH class ", e.cause)
        false
    }
}
