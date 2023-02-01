
package com.wix.detox.reactnative.idlingresources.timers

import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.TimingModule

private const val BUSY_WINDOW_THRESHOLD = 1500L

/**
 * Delegates the interrogation to the native module itself, added
 * [here](https://github.com/facebook/react-native/pull/27539) in the context
 * of RN v0.62 (followed by a previous refactor and rename of the class).
 */
class DelegatedIdleInterrogationStrategy(private val timingModule: TimingModule): IdleInterrogationStrategy {
    override fun isIdleNow(): Boolean = !timingModule.hasActiveTimersInRange(BUSY_WINDOW_THRESHOLD)

    companion object {
        fun create(reactContext: ReactContext): DelegatedIdleInterrogationStrategy {
            val timingModule = reactContext.getNativeModule(TimingModule::class.java)!!
            return DelegatedIdleInterrogationStrategy(timingModule)
        }
    }
}
