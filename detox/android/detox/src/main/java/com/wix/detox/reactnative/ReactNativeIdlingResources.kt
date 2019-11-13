package com.wix.detox.reactnative

import android.os.Looper
import android.util.Log
import androidx.test.espresso.IdlingRegistry
import androidx.test.espresso.base.IdlingResourceRegistry
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.network.NetworkingModule
import com.wix.detox.reactnative.idlingresources.*
import okhttp3.OkHttpClient
import org.joor.Reflect
import org.joor.ReflectException

private const val LOG_TAG = "DetoxRNIdleRes"

class MQThreadsReflector(private val reactContext: ReactContext) {
    fun getQueue(queueName: String): MQThreadReflected? {
        try {
            val queue = Reflect.on(reactContext).field(queueName).get() as Any?
            return MQThreadReflected(queue, queueName)
        } catch (e: ReflectException) {
            Log.e(LOG_TAG, "Could not find queue: $queueName", e)
        }
        return null
    }
}

class MQThreadReflected(private val queue: Any?, private val queueName: String) {
    fun getLooper(): Looper? {
        try {
            if (queue != null) {
                return Reflect.on(queue).call(METHOD_GET_LOOPER).get()
            }
        } catch (e: ReflectException) {
            Log.e(LOG_TAG, "Could not find looper for queue: $queueName", e)
        }
        return null
    }

    companion object {
        const val METHOD_GET_LOOPER = "getLooper"
    }
}

class NetworkingModuleReflected(private val reactContext: ReactContext) {
    fun getHttpClient(): OkHttpClient? {
        if (reactContext.hasNativeModule(NetworkingModule::class.java)) {
            val networkNativeModule = reactContext.getNativeModule(NetworkingModule::class.java)
            try {
                return Reflect.on(networkNativeModule).field(FIELD_OKHTTP_CLIENT).get()
            } catch (e: ReflectException) {
                Log.e(LOG_TAG, "Can't set up Networking Module listener", e)
            }
        }
        return null
    }

    companion object {
        private const val FIELD_OKHTTP_CLIENT = "mClient"
    }
}

class ReactNativeIdlingResources
    constructor(
        private val reactContext: ReactContext,
        internal var networkSyncEnabled: Boolean = true) {

    companion object {
        private const val FIELD_UI_BG_MSG_QUEUE = "mUiBackgroundMessageQueueThread"
        private const val FIELD_NATIVE_MODULES_MSG_QUEUE = "mNativeModulesMessageQueueThread"
        private const val FIELD_JS_MSG_QUEUE = "mJSMessageQueueThread"
    }

    private var timersIdlingResource: TimersIdlingResource? = null
    private var rnBridgeIdlingResource: BridgeIdlingResource? = null
    private var uiModuleIdlingResource: UIModuleIdlingResource? = null
    private var animIdlingResource: AnimatedModuleIdlingResource? = null
    private var networkIdlingResource: NetworkIdlingResource? = null

    fun registerAll() {
        Log.i(LOG_TAG, "Setting up Espresso Idling Resources for React Native.")
        unregisterAll()
        setupMQThreadsInterrogators()
        setupCustomRNIdlingResources()
        if (networkSyncEnabled) {
            setupNetworkIdlingResource()
        }
    }

    fun unregisterAll() {
        removeNetworkIdlingResource()
        unregisterAllIdlingResources(reactContext)
    }

    fun setNetworkSynchronization(enable: Boolean) {
        if (networkSyncEnabled == enable) {
            return
        }

        if (enable) {
            setupNetworkIdlingResource()
        } else {
            removeNetworkIdlingResource()
        }
        networkSyncEnabled = enable
    }

    fun pauseRNTimersIdlingResource() = timersIdlingResource?.pause()
    fun resumeRNTimersIdlingResource() = timersIdlingResource?.resume()

    private fun setupMQThreadsInterrogators() {
        val mqThreadsReflector = MQThreadsReflector(reactContext)
        val mqUIBackground = mqThreadsReflector.getQueue(FIELD_UI_BG_MSG_QUEUE)?.getLooper()
        val mqJS = mqThreadsReflector.getQueue(FIELD_JS_MSG_QUEUE)?.getLooper()
        val mqNativeModules = mqThreadsReflector.getQueue(FIELD_NATIVE_MODULES_MSG_QUEUE)?.getLooper()

        IdlingRegistry.getInstance().apply {
//            registerLooperAsIdlingResource(mqUIBackground)
            registerLooperAsIdlingResource(mqJS)
            registerLooperAsIdlingResource(mqNativeModules)

            val irr: IdlingResourceRegistry = Reflect.on(androidx.test.espresso.Espresso::class.java).field("baseRegistry").get()
            irr.sync(this.resources, this.loopers)
        }
    }

    private fun setupCustomRNIdlingResources() {
        rnBridgeIdlingResource = BridgeIdlingResource(reactContext)
        timersIdlingResource = TimersIdlingResource(reactContext)
        uiModuleIdlingResource = UIModuleIdlingResource(reactContext)
        animIdlingResource = AnimatedModuleIdlingResource(reactContext)

        IdlingRegistry.getInstance().apply {
            register(timersIdlingResource)
            register(rnBridgeIdlingResource)
            register(uiModuleIdlingResource)
            register(animIdlingResource)
        }
    }

    private fun unregisterAllIdlingResources(reactContext: ReactContext) {
        IdlingRegistry.getInstance().apply {
            unregister(timersIdlingResource)
            unregister(rnBridgeIdlingResource)
            unregister(uiModuleIdlingResource)
            unregister(animIdlingResource)
        }

        reactContext.catalystInstance.removeBridgeIdleDebugListener(rnBridgeIdlingResource)
    }

    private fun setupNetworkIdlingResource() {
        try {
            val client = NetworkingModuleReflected(reactContext).getHttpClient()!!
            networkIdlingResource = NetworkIdlingResource(client.dispatcher())
            IdlingRegistry.getInstance().register(networkIdlingResource)
        } catch (e: ReflectException) {
            Log.e(LOG_TAG, "Can't set up Networking Module listener", e.cause)
        }
    }

    private fun removeNetworkIdlingResource() {
        networkIdlingResource?.let {
            it.stop()
            IdlingRegistry.getInstance().unregister(networkIdlingResource)
            networkIdlingResource = null
        }
    }
}
