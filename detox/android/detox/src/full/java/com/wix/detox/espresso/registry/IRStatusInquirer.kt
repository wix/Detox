package com.wix.detox.espresso.registry

import android.os.Handler
import android.os.Looper
import androidx.test.espresso.Espresso
import androidx.test.espresso.IdlingResource
import androidx.test.espresso.base.IdlingResourceRegistry
import org.joor.Reflect
import java.util.concurrent.FutureTask

class IRStatusInquirer(private val registry: IdlingResourceRegistry) {
    fun getAllBusyResources(): List<IdlingResource> {
        return FutureTask<List<IdlingResource>> {
                registry.resources.filter { resource ->
                    !resource.isIdleNow
                }
            }.also {
                val handler = Handler(Looper.getMainLooper())
                handler.postAtFrontOfQueue(it)
            }.get()
    }

    companion object {
        val INSTANCE = IRStatusInquirer(getRegistryDefault())
    }
}

private fun getRegistryDefault() = Reflect.on(Espresso::class.java).get<IdlingResourceRegistry>("baseRegistry")
