package com.wix.detox.reactnative.idlingresources

import com.facebook.react.bridge.ReactContext
import com.wix.detox.reactnative.ReactNativeInfo

abstract class BridgeIdlingResource: DetoxBaseIdlingResource() {

    override fun getName(): String = BridgeIdlingResourceRN71::class.java.name
    override fun getDebugName() = "bridge"
    override fun getBusyHint(): Map<String, Any>? = null

    abstract fun onDetach()

    companion object {
        fun instance(reactContext: ReactContext): BridgeIdlingResource =
            if (ReactNativeInfo.rnVersion().minor < 71)
                BridgeIdlingResourceLegacy(reactContext)
            else
                BridgeIdlingResourceRN71(reactContext)
    }
}
