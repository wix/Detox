package com.wix.detox.reactnative.idlingresources.asynctask

import com.wix.detox.espresso.action.common.utils.getUiController
import org.joor.Reflect
import org.joor.ReflectException

private const val FIELD_ASYNC_IDLE = "asyncIdle"
private const val FIELD_COMPAT_IDLE = "compatIdle"
private const val METHOD_IS_IDLE_NOW = "isIdleNow"

class UiControllerImplReflected {
    fun invokeAsyncIsIdle(): Boolean {
        return try {
            Reflect.on(getUiController()).field(FIELD_ASYNC_IDLE).call(METHOD_IS_IDLE_NOW).get()
        } catch (err: ReflectException) {
            true
        }
    }

    fun invokeCompatIsIdle(): Boolean {
        return try {
            Reflect.on(getUiController()).field(FIELD_COMPAT_IDLE).call(METHOD_IS_IDLE_NOW).get()
        } catch (err: ReflectException) {
            true
        }
    }
}
