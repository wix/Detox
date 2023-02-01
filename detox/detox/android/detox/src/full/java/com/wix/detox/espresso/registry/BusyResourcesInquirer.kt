package com.wix.detox.espresso.registry

import androidx.test.espresso.Espresso
import androidx.test.espresso.base.IdlingResourceRegistry
import com.wix.detox.common.UIThread
import com.wix.detox.espresso.common.UiControllerImplReflected
import com.wix.detox.inquiry.DetoxBusyResource
import com.wix.detox.inquiry.DetoxBusyResource.BusyAsyncTasks
import com.wix.detox.inquiry.DetoxBusyResource.BusyIdlingResource
import org.joor.Reflect
import java.util.concurrent.Callable

// TODO Better to split inquiry to two separate classes running under the single `UIThread.postFirstSync()` we have here.
class BusyResourcesInquirer(
    private val registry: IdlingResourceRegistry,
    private val uiControllerImplReflected: UiControllerImplReflected
) {
    fun getAllBusyResources(): List<DetoxBusyResource> {
        return UIThread.postFirstSync(Callable<List<DetoxBusyResource>> {
            mutableListOf<DetoxBusyResource>().apply {
                addAll(getBusyIdlingResources())
                addAll(getAsyncTasksResource()?.let { listOf(it) } ?: emptyList())
            }
        })
    }

    private fun getBusyIdlingResources(): List<BusyIdlingResource> =
        registry.resources
            .filter { !it.isIdleNow }
            .map { BusyIdlingResource(it) }

    private fun getAsyncTasksResource(): BusyAsyncTasks? {
        // Mind the implicit optimization:
        // Don't inspect both resources if not necessary (async-tasks is not idle).
        if (uiControllerImplReflected.isAsyncIdleNow() &&
            uiControllerImplReflected.isCompatIdleNow()) {
            return null
        }
        return BusyAsyncTasks
    }

    companion object {
        val INSTANCE = BusyResourcesInquirer(getRegistryDefault(), UiControllerImplReflected())
    }
}

private fun getRegistryDefault() =
    Reflect.on(Espresso::class.java).get<IdlingResourceRegistry>("baseRegistry")
