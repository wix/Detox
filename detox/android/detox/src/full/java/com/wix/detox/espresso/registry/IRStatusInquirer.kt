package com.wix.detox.espresso.registry

import androidx.test.espresso.Espresso
import androidx.test.espresso.IdlingResource
import androidx.test.espresso.base.IdlingResourceRegistry
import com.wix.detox.common.UIThread
import org.joor.Reflect
import java.util.concurrent.Callable

class IRStatusInquirer(private val registry: IdlingResourceRegistry) {
    fun getAllBusyResources(): List<IdlingResource> {
        return UIThread.postFirstSync(Callable<List<IdlingResource>> {
            registry.resources.filter { resource ->
                !resource.isIdleNow
            }
        })
    }

    companion object {
        val INSTANCE = IRStatusInquirer(getRegistryDefault())
    }
}

private fun getRegistryDefault() = Reflect.on(Espresso::class.java).get<IdlingResourceRegistry>("baseRegistry")
