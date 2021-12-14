package com.wix.detox.reactnative.idlingresources

import android.util.Log
import com.wix.detox.common.DetoxLog.Companion.LOG_TAG
import java.lang.ref.WeakReference

private const val NUM_TIMES_BEFORE_NOTIFY_IDLE = 10
private const val SET_NATIVE_VALUE = "setNativeValue"

private const val CLASS_REACT_SWITCH = "com.facebook.react.views.switchview.ReactSwitch"

class RN66Workaround {
    private var timesStuckQueueDetected = 0
    private var stuckOperation: WeakReference<Any?>? = null

    // This is a workaround for https://github.com/facebook/react-native/issues/32594
    // uses duck typing heuristics to determine that this is probably the stuck Switch operation and if so, ignores it
    fun performWorkaround(uiManagerModuleReflected: UIManagerModuleReflected): Boolean {
        var isStuckSwitchOperation = false

        if (uiManagerModuleReflected.getViewCommandOperationsSize() == 1) {
            val isReactSwitch = try {
                val viewClass = uiManagerModuleReflected.getViewClass()
                val ReactSwitchClass: Class<*> = Class.forName(CLASS_REACT_SWITCH)
                if (viewClass != null) ReactSwitchClass.isAssignableFrom(viewClass.javaClass) else false
            } catch (e: Exception) {
                Log.e(LOG_TAG, "got exception with class ", e)
                false
            }

            val hasOneRetryIncremented = uiManagerModuleReflected.getNumRetries() == 1
            val viewCommand: String = uiManagerModuleReflected.getViewCommand()
            val isSetNativeValueCommand = viewCommand == SET_NATIVE_VALUE
            val firstElement = uiManagerModuleReflected.getWeakRefFirstElement()

            if (isReactSwitch && hasOneRetryIncremented && isSetNativeValueCommand) {
                if (stuckOperation?.get() == firstElement?.get()) {
                    timesStuckQueueDetected++
                } else {
                    stuckOperation = firstElement
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
}