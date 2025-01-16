package com.wix.detox.reactnative.idlingresources.factory

import com.facebook.react.ReactApplication
import com.wix.detox.reactnative.getCurrentReactContext
import com.wix.detox.reactnative.getCurrentReactContextSafe
import com.wix.detox.reactnative.idlingresources.DetoxIdlingResource
import com.wix.detox.reactnative.idlingresources.animations.AnimatedModuleIdlingResource
import com.wix.detox.reactnative.idlingresources.network.NetworkIdlingResource
import com.wix.detox.reactnative.idlingresources.storage.AsyncStorageIdlingResource
import com.wix.detox.reactnative.idlingresources.timers.FabricTimersIdlingResource
import com.wix.detox.reactnative.idlingresources.uimodule.fabric.FabricUIManagerIdlingResources
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class FabricDetoxIdlingResourceFactoryStrategy(private val reactApplication: ReactApplication) :
    DetoxIdlingResourceFactoryStrategy {
    override suspend fun create(): Map<IdlingResourcesName, DetoxIdlingResource> =
        withContext(Dispatchers.Main) {
            val reactContext = reactApplication.getCurrentReactContextSafe()

            val result = mutableMapOf(
                IdlingResourcesName.UI to FabricUIManagerIdlingResources(reactContext),
                IdlingResourcesName.Animations to AnimatedModuleIdlingResource(reactContext),
                IdlingResourcesName.Timers to FabricTimersIdlingResource(reactContext),
                IdlingResourcesName.Network to NetworkIdlingResource(reactContext),
                IdlingResourcesName.AsyncStorage to AsyncStorageIdlingResource(reactContext)
            )

            return@withContext result
        }
}
