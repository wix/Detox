package com.wix.detox.reactnative.idlingresources.bridge

import android.util.Log
import com.facebook.react.bridge.ReactContext
import com.wix.detox.reactnative.idlingresources.DetoxIdlingResource
import java.lang.reflect.InvocationHandler
import java.lang.reflect.Method
import java.lang.reflect.Proxy
import java.util.concurrent.atomic.AtomicBoolean

/**
 * IdlingResource for Espresso, which monitors the traffic of
 * React Native's JS bridge.
 *
 * Uses reflection to interact with the bridge idle debug listener API,
 * which was removed in RN 0.84. This allows the class to compile against
 * any RN version while still functioning on older versions that have the API.
 */
class BridgeIdlingResource(private val reactContext: ReactContext) : DetoxIdlingResource() {
    private val idleNow = AtomicBoolean(true)
    private var listenerProxy: Any? = null

    init {
        try {
            val listenerClass = Class.forName("com.facebook.react.bridge.NotThreadSafeBridgeIdleDebugListener")
            val handler = InvocationHandler { _, method, _ ->
                when (method.name) {
                    "onTransitionToBridgeIdle" -> {
                        idleNow.set(true)
                        notifyIdle()
                    }
                    "onTransitionToBridgeBusy" -> {
                        idleNow.set(false)
                    }
                    "onBridgeDestroyed" -> { }
                }
                null
            }
            listenerProxy = Proxy.newProxyInstance(listenerClass.classLoader, arrayOf(listenerClass), handler)

            val catalystInstance = reactContext.catalystInstance
            val addMethod = catalystInstance.javaClass.getMethod("addBridgeIdleDebugListener", listenerClass)
            addMethod.invoke(catalystInstance, listenerProxy)
        } catch (e: Exception) {
            Log.w(LOG_TAG, "Bridge idle debug listener API not available (RN 0.84+), bridge idling resource will report idle", e)
            idleNow.set(true)
        }
    }

    fun onDetach() {
        val proxy = listenerProxy ?: return
        try {
            val listenerClass = Class.forName("com.facebook.react.bridge.NotThreadSafeBridgeIdleDebugListener")
            val catalystInstance = reactContext.catalystInstance
            val removeMethod = catalystInstance.javaClass.getMethod("removeBridgeIdleDebugListener", listenerClass)
            removeMethod.invoke(catalystInstance, proxy)
        } catch (e: Exception) {
            Log.w(LOG_TAG, "Failed to remove bridge idle debug listener", e)
        }
        listenerProxy = null
    }

    override fun getName(): String {
        return BridgeIdlingResource::class.java.name
    }

    override fun getDebugName(): String {
        return "bridge"
    }

    override fun getBusyHint(): Map<String, Any>? {
        return null
    }

    override fun checkIdle(): Boolean {
        val ret = idleNow.get()
        if (!ret) {
            Log.i(LOG_TAG, "JS Bridge is busy")
        }
        return ret
    }

    override fun onUnregistered() {
        super.onUnregistered()
        onDetach()
    }

    companion object {
        private const val LOG_TAG = "Detox"
    }
}
