package com.wix.detox.reactnative.idlingresources.factory

import com.wix.detox.reactnative.idlingresources.DetoxIdlingResource

interface DetoxIdlingResourceFactoryStrategy {
    suspend fun create(): Map<IdlingResourcesName, DetoxIdlingResource>
}
