package com.wix.detox.reactnative.idlingresources.factory

import com.facebook.react.ReactApplication
import com.wix.detox.reactnative.getCurrentReactContextSafe
import com.wix.detox.reactnative.idlingresources.DetoxIdlingResource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class NewArchitectureDetoxIdlingResourceFactoryStrategy(private val reactApplication: ReactApplication) :
    DetoxIdlingResourceFactoryStrategy {
    override suspend fun create(): Map<IdlingResourcesName, DetoxIdlingResource> =
        withContext(Dispatchers.Main) {
            val reactContext =
                reactApplication.getCurrentReactContextSafe()
                    ?: throw IllegalStateException("ReactContext is null")

            val result = mutableMapOf<IdlingResourcesName, DetoxIdlingResource>()

            return@withContext result
        }
}
