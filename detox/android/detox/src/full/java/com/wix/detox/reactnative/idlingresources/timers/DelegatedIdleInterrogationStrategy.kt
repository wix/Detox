
package com.wix.detox.reactnative.idlingresources.timers

import android.os.Debug
import android.util.Log
import com.facebook.react.bridge.JavaScriptModule
import com.facebook.react.bridge.ReactContext
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.modules.core.TimingModule

private const val BUSY_WINDOW_THRESHOLD = 1500L

/**
 * Delegates the interrogation to the native module itself, added
 * [here](https://github.com/facebook/react-native/pull/27539) in the context
 * of RN v0.62 (followed by a previous refactor and rename of the class).
 */
class DelegatedIdleInterrogationStrategy(): IdleInterrogationStrategy {
    override fun isIdleNow(): Boolean = false//!timingModule.hasActiveTimersInRange(BUSY_WINDOW_THRESHOLD)

    companion object {
        fun create(reactContext: ReactContext): DelegatedIdleInterrogationStrategy {
            //Debug.waitForDebugger()
            Log.d("Detox", "Creating DelegatedIdleInterrogationStrategy with reactContext: $reactContext")
            val timingModule = reactContext.getJSModule(JavaScriptModule::class.java)!!
            return DelegatedIdleInterrogationStrategy()
        }
    }
}
