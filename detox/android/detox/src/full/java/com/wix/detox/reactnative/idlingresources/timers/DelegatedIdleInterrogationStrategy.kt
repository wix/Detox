package com.wix.detox.reactnative.idlingresources.timers

import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactContext
import com.wix.detox.common.RNDropSupportTodo
import com.wix.detox.reactnative.helpers.RNHelpers
import org.joor.Reflect

private const val BUSY_WINDOW_THRESHOLD = 1500L

private class RN62TimingModuleReflected(private val timingModule: NativeModule) {
    fun hasActiveTimers(): Boolean = Reflect.on(timingModule).call("hasActiveTimersInRange", BUSY_WINDOW_THRESHOLD).get()
}

/**
 * Delegates the interrogation to the native module itself, added
 * [here](https://github.com/facebook/react-native/pull/27539) in the context
 * of RN v0.62 (followed by a previous refactor and rename of the class).
 */
@RNDropSupportTodo(62, """
    When min RN version supported by Detox is 0.62.x (or higher), can (and
    should) remove any usage of reflection here.
    That includes the unit test's stub being used for that reason in particular.
    """)
class DelegatedIdleInterrogationStrategy(timingModule: NativeModule): IdleInterrogationStrategy {
    private val timingModuleReflected = RN62TimingModuleReflected(timingModule)

    override fun isIdleNow(): Boolean = !timingModuleReflected.hasActiveTimers()

    companion object {
        fun createIfSupported(reactContext: ReactContext): DelegatedIdleInterrogationStrategy? {
            val module = RNHelpers.getNativeModule(reactContext, "com.facebook.react.modules.core.TimingModule")
                    ?: return null

            return try {
                module.javaClass.getDeclaredMethod("hasActiveTimersInRange", Long::class.java)
                DelegatedIdleInterrogationStrategy(module)
            } catch (ex: Exception) {
                null
            }
        }
    }
}
