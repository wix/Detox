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
    suspend fun create(): Map<IdlingResourcesName, DetoxIdlingResource> = withContext(Dispatchers.Main) {
        val result = mutableMapOf(
            IdlingResourcesName.Timers to TimersIdlingResource(reactContext),
            IdlingResourcesName.RNBridge to BridgeIdlingResource(reactContext),
            IdlingResourcesName.UIModule to UIModuleIdlingResource(reactContext),
            IdlingResourcesName.Animations to AnimatedModuleIdlingResource(reactContext),
            IdlingResourcesName.Network to NetworkIdlingResource(reactContext)
        )

        val asyncStorageIdlingResource = AsyncStorageIdlingResource.createIfNeeded(reactContext)
        if (asyncStorageIdlingResource != null) {
            result[IdlingResourcesName.AsyncStorage] = asyncStorageIdlingResource
        }

        return@withContext result
    }
}

