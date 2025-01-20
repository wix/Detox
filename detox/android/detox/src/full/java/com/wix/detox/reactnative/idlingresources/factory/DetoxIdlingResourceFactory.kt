package com.wix.detox.reactnative.idlingresources.factory

import com.facebook.react.ReactApplication
import com.wix.detox.reactnative.idlingresources.DetoxIdlingResource
import com.wix.detox.reactnative.isFabricEnabled
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext


class DetoxIdlingResourceFactory(private val reactApplication: ReactApplication) {
    suspend fun create(): Map<IdlingResourcesName, DetoxIdlingResource> = withContext(Dispatchers.Main) {
        val strategy = if (isFabricEnabled()) {
            FabricDetoxIdlingResourceFactoryStrategy(reactApplication)
        } else {
            OldArchitectureDetoxIdlingResourceFactoryStrategy(reactApplication)
        }

        return@withContext strategy.create()
    }
}

