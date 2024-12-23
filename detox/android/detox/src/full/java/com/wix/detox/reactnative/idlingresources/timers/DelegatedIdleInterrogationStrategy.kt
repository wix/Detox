@file:Suppress("INVISIBLE_MEMBER", "INVISIBLE_REFERENCE")

package com.wix.detox.reactnative.idlingresources.timers

import android.os.Debug
import android.util.Log
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.JavaTimerManager
import com.facebook.react.modules.core.TimingModule
import java.lang.reflect.Field

private const val BUSY_WINDOW_THRESHOLD = 1500L



/**
 * Delegates the interrogation to the native module itself, added
 * [here](https://github.com/facebook/react-native/pull/27539) in the context
 * of RN v0.62 (followed by a previous refactor and rename of the class).
 */
class DelegatedIdleInterrogationStrategy(private val timingModule: JavaTimerManager): IdleInterrogationStrategy {
    override fun isIdleNow(): Boolean = !hasActiveTimer()  // !timingModule.hasActiveTimersInRange(BUSY_WINDOW_THRESHOLD)

    private fun hasActiveTimer():Boolean {
        //Debug.waitForDebugger()
        val hasActiveTimer = timingModule.hasActiveTimersInRange(BUSY_WINDOW_THRESHOLD)
        //Log.d("Detox", "DelegatedIdleInterrogationStrategy.hasActiveTimer: $hasActiveTimer")

        return hasActiveTimer
    }

    companion object {
        fun create(reactContext: ReactContext): DelegatedIdleInterrogationStrategy {
            Log.d("Detox", "Creating DelegatedIdleInterrogationStrategy with reactContext: $reactContext")
            val timingModule = getTimersManager(reactContext) as JavaTimerManager
            return DelegatedIdleInterrogationStrategy(timingModule)
        }

        private fun getTimersManager(reactContext: Any): Any {
            // Accessing the mReactHost field
            val mReactHostField: Field = reactContext::class.java.getDeclaredField("mReactHost")
            mReactHostField.isAccessible = true
            val mReactHost = mReactHostField.get(reactContext)

            // Accessing the mReactInstance field
            val mReactInstanceField: Field = mReactHost::class.java.getDeclaredField("mReactInstance")
            mReactInstanceField.isAccessible = true
            val mReactInstance = mReactInstanceField.get(mReactHost)

            // Accessing the mFabricUIManager field
            val mJavaTimerManagerField: Field = mReactInstance::class.java.getDeclaredField("mJavaTimerManager")
            mJavaTimerManagerField.isAccessible = true
            val javaTimerManager = mJavaTimerManagerField.get(mReactInstance)
            return javaTimerManager!!
        }


    }


}
