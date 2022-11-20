package com.wix.detox.espresso.registry

import androidx.test.espresso.Espresso
import androidx.test.espresso.IdlingResource
import androidx.test.espresso.base.IdlingResourceRegistry
import com.wix.detox.common.UIThread
import com.wix.detox.reactnative.idlingresources.asynctask.DetoxBusyResource
import com.wix.detox.reactnative.idlingresources.asynctask.DetoxBusyResourceHelper
import com.wix.detox.reactnative.idlingresources.asynctask.UiControllerImplReflected
import org.joor.Reflect
import java.util.concurrent.Callable

class IRStatusInquirer(
    private val registry: IdlingResourceRegistry,
    private val uiControllerImplReflected: UiControllerImplReflected
) {
    fun getAllBusyResources(): List<DetoxBusyResource> {
        return UIThread.postFirstSync(Callable<List<DetoxBusyResource>> {
            val busyResources = mutableListOf<DetoxBusyResource>()

            busyResources.addAll(checkEspressoRegistry())
            checkAsyncTasks()?.let { busyResources.add(it) }

            busyResources
        })
    }

    private fun checkEspressoRegistry(): List<DetoxBusyResource> {
        val detoxBusyResourceHelper = DetoxBusyResourceHelper()
        val busyResources = getBusyRegistryResources()

        if (busyResources.isEmpty()) {
            return emptyList()
        }

        return detoxBusyResourceHelper.convertToDetoxBusyResourcesList(busyResources)
    }

    private fun getBusyRegistryResources(): List<IdlingResource> {
        return registry.resources.filter { resource ->
            !resource.isIdleNow
        }
    }

    private fun checkAsyncTasks(): DetoxBusyResource? {
        val backgroundTasksTag = "bg"
        val backgroundTasksDescription = "asynctasks"

        val asyncIsIdle = uiControllerImplReflected.invokeAsyncIsIdle()
        val compatIsIdle = uiControllerImplReflected.invokeCompatIsIdle()

        if (asyncIsIdle && compatIsIdle) {
            return null
        }

        return DetoxBusyResource(backgroundTasksTag, mapOf("reason" to backgroundTasksDescription))
    }

    companion object {
        val INSTANCE = IRStatusInquirer(getRegistryDefault(), UiControllerImplReflected())
    }
}

private fun getRegistryDefault() =
    Reflect.on(Espresso::class.java).get<IdlingResourceRegistry>("baseRegistry")
