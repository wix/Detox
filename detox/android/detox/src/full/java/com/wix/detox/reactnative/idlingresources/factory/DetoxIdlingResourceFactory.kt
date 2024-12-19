package com.wix.detox.reactnative.idlingresources.factory

import com.facebook.react.bridge.ReactContext
import com.wix.detox.reactnative.idlingresources.DetoxIdlingResource
import com.wix.detox.reactnative.idlingresources.animations.AnimatedModuleIdlingResource
import com.wix.detox.reactnative.idlingresources.bridge.BridgeIdlingResource
import com.wix.detox.reactnative.idlingresources.network.NetworkIdlingResource
import com.wix.detox.reactnative.idlingresources.storage.AsyncStorageIdlingResource
import com.wix.detox.reactnative.idlingresources.timers.TimersIdlingResource
import com.wix.detox.reactnative.idlingresources.uimodule.UIModuleIdlingResource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class DetoxIdlingResourceFactory(private val reactContext: ReactContext) {
    suspend fun create(name: IdlingResourcesName): DetoxIdlingResource? = withContext(Dispatchers.Main) {
        return@withContext when (name) {
            IdlingResourcesName.Timers -> TimersIdlingResource(reactContext)
            IdlingResourcesName.AsyncStorage -> AsyncStorageIdlingResource.createIfNeeded(reactContext)
            IdlingResourcesName.RNBridge -> BridgeIdlingResource(reactContext)
            IdlingResourcesName.UIModule -> UIModuleIdlingResource(reactContext)
            IdlingResourcesName.Animations -> AnimatedModuleIdlingResource(reactContext)
            IdlingResourcesName.Network -> NetworkIdlingResource(reactContext)
        }
    }
}
