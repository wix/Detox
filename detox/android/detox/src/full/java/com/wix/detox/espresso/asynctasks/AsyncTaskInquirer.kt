package com.wix.detox.espresso.asynctasks

import com.wix.detox.reactnative.idlingresources.asynctask.DetoxBusyResource
import com.wix.detox.reactnative.idlingresources.asynctask.UiControllerImplReflected

class AsyncTaskInquirer(
    private val uiControllerImplReflected: UiControllerImplReflected
) {
    fun getBusyAsyncTasks(): DetoxBusyResource? {
        val name = "bg"
        val reason = "asynctasks"

        val asyncIsIdle = uiControllerImplReflected.invokeAsyncIsIdle()
        val compatIsIdle = uiControllerImplReflected.invokeCompatIsIdle()

        if (asyncIsIdle && compatIsIdle) {
            return null
        }

        return DetoxBusyResource(name, reason)
    }

    companion object {
        val INSTANCE = AsyncTaskInquirer(UiControllerImplReflected())
    }
}