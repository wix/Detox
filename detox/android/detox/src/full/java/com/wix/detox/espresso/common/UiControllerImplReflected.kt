package com.wix.detox.espresso.common

import com.wix.detox.espresso.action.common.utils.getUiController
import org.joor.Reflect

private const val FIELD_ASYNC_IDLE = "asyncIdle"
private const val FIELD_COMPAT_IDLE = "compatIdle"
private const val METHOD_IS_IDLE_NOW = "isIdleNow"

class UiControllerImplReflected {
    fun isAsyncIdleNow(): Boolean =
        Reflect.on(getUiController()).field(FIELD_ASYNC_IDLE).call(METHOD_IS_IDLE_NOW).get()

    fun isCompatIdleNow(): Boolean =
        Reflect.on(getUiController()).field(FIELD_COMPAT_IDLE).call(METHOD_IS_IDLE_NOW).get()
}
