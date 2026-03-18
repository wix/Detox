package com.wix.detox.reactnative.idlingresources.bridge

import android.util.Log
import com.facebook.react.bridge.ReactContext
import com.wix.detox.reactnative.idlingresources.DetoxIdlingResource
import java.lang.reflect.InvocationHandler
import java.lang.reflect.Method
import java.lang.reflect.Proxy
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Created by simonracz on 01/06/2017.
 */
/**
 *
 *
 * IdlingResource for Espresso, which monitors the traffic of
 * React Native's JS bridge.
 *
 */
class BridgeIdlingResource(private val reactContext: ReactContext) : DetoxIdlingResource() {
    private val idleNow = AtomicBoolean(true)
    private val bridgeIdleListenerApi = BridgeIdleListenerApi(reactContext)

    init {
        bridgeIdleListenerApi.attach(
            onBridgeIdle = {
                idleNow.set(true)
                notifyIdle()
            },
            onBridgeBusy = {
                idleNow.set(false)
            },
            onBridgeDestroyed = {}
        )
    }

    fun onDetach() {
        bridgeIdleListenerApi.detach()
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

private class BridgeIdleListenerApi(private val reactContext: ReactContext) {
    private var listenerProxy: Any? = null
    private var removeListenerMethod: Method? = null

    fun attach(
        onBridgeIdle: () -> Unit,
        onBridgeBusy: () -> Unit,
        onBridgeDestroyed: () -> Unit,
    ) {
        try {
            val listenerClass = Class.forName(BRIDGE_IDLE_LISTENER_CLASS_NAME)
            val catalystInstance = reactContext.catalystInstance
            val addListenerMethod = catalystInstance.javaClass.methods.firstOrNull { method ->
                method.name == ADD_LISTENER_METHOD && method.parameterTypes.contentEquals(arrayOf(listenerClass))
            } ?: run {
                Log.i(LOG_TAG, "RN bridge idle debug listener API is unavailable.")
                return
            }

            val proxy = Proxy.newProxyInstance(
                listenerClass.classLoader,
                arrayOf(listenerClass),
                InvocationHandler { _, method, _ ->
                    when (method.name) {
                        ON_BRIDGE_IDLE_METHOD -> onBridgeIdle()
                        ON_BRIDGE_BUSY_METHOD -> onBridgeBusy()
                        ON_BRIDGE_DESTROYED_METHOD -> onBridgeDestroyed()
                    }
                    null
                }
            )

            addListenerMethod.invoke(catalystInstance, proxy)
            listenerProxy = proxy
            removeListenerMethod = catalystInstance.javaClass.methods.firstOrNull { method ->
                method.name == REMOVE_LISTENER_METHOD && method.parameterTypes.contentEquals(arrayOf(listenerClass))
            }
        } catch (e: Throwable) {
            Log.w(LOG_TAG, "Could not attach RN bridge idle debug listener.", e)
        }
    }

    fun detach() {
        val listener = listenerProxy ?: return
        val removeMethod = removeListenerMethod ?: return
        try {
            removeMethod.invoke(reactContext.catalystInstance, listener)
        } catch (e: Throwable) {
            Log.w(LOG_TAG, "Could not detach RN bridge idle debug listener.", e)
        } finally {
            listenerProxy = null
            removeListenerMethod = null
        }
    }

    companion object {
        private const val LOG_TAG = "Detox"
        private const val BRIDGE_IDLE_LISTENER_CLASS_NAME =
            "com.facebook.react.bridge.NotThreadSafeBridgeIdleDebugListener"
        private const val ADD_LISTENER_METHOD = "addBridgeIdleDebugListener"
        private const val REMOVE_LISTENER_METHOD = "removeBridgeIdleDebugListener"
        private const val ON_BRIDGE_IDLE_METHOD = "onTransitionToBridgeIdle"
        private const val ON_BRIDGE_BUSY_METHOD = "onTransitionToBridgeBusy"
        private const val ON_BRIDGE_DESTROYED_METHOD = "onBridgeDestroyed"
    }
}
