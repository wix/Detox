package com.wix.detox.reactnative

import android.os.Looper
import android.util.Log
import androidx.test.espresso.Espresso
import androidx.test.espresso.IdlingRegistry
import androidx.test.espresso.base.IdlingResourceRegistry
import com.facebook.react.bridge.ReactContext
import com.wix.detox.LaunchArgs
import com.wix.detox.reactnative.idlingresources.*
import com.wix.detox.reactnative.idlingresources.timers.TimersIdlingResource
import com.wix.detox.reactnative.idlingresources.timers.getInterrogationStrategy
import com.wix.detox.reactnative.idlingresources.uimodule.UIModuleIdlingResource
import org.joor.Reflect
import org.joor.ReflectException

private const val LOG_TAG = "DetoxRNIdleRes"

private class MQThreadsReflector(private val reactContext: ReactContext) {
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

private class MQThreadReflected(private val queue: Any?, private val queueName: String) {
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

class ReactNativeIdlingResources constructor(
    private val reactContext: ReactContext,
    private var launchArgs: LaunchArgs,
    internal var networkSyncEnabled: Boolean = true
) {
    companion object {
        private const val FIELD_NATIVE_MODULES_MSG_QUEUE = "mNativeModulesMessageQueueThread"
        private const val FIELD_JS_MSG_QUEUE = "mJSMessageQueueThread"
    }

    private var timersIdlingResource: TimersIdlingResource? = null
    private var asyncStorageIdlingResource: AsyncStorageIdlingResource? = null
    private var legacyAsyncStorageIdlingResource: AsyncStorageIdlingResource? = null
    private var rnBridgeIdlingResource: BridgeIdlingResource? = null
    private var uiModuleIdlingResource: UIModuleIdlingResource? = null
    private var animIdlingResource: AnimatedModuleIdlingResource? = null
    private var networkIdlingResource: NetworkIdlingResource? = null

    fun registerAll() {
        Log.i(LOG_TAG, "Setting up Espresso Idling Resources for React Native")
        unregisterAll()

        setupUrlBlacklist()
        setupMQThreadsInterrogators()
        syncIdlingResources()
        setupCustomRNIdlingResources()
        syncIdlingResources()
    }

    fun unregisterAll() {
        unregisterMQThreadsInterrogators()
        unregisterCustomRNIdlingResources()
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

    fun pauseNetworkSynchronization() = networkIdlingResource?.pause()
    fun resumeNetworkSynchronization() {
        if (networkSyncEnabled) {
            networkIdlingResource?.resume()
        }
    }

    fun pauseRNTimersIdlingResource() = timersIdlingResource?.pause()
    fun resumeRNTimersIdlingResource() = timersIdlingResource?.resume()
    fun pauseUIIdlingResource() = uiModuleIdlingResource?.pause()
    fun resumeUIIdlingResource() = uiModuleIdlingResource?.resume()

    fun setBlacklistUrls(urlList: String) {
        setIldingResourceBlacklist(urlList)
    }

    private fun setIldingResourceBlacklist(urlList: String) {
        val urlArray = toFormattedUrlArray(urlList)
        NetworkIdlingResource.setURLBlacklist(urlArray)
    }

    private fun setupMQThreadsInterrogators() {
        if (IdlingRegistry.getInstance().loopers.isEmpty()) {
            val mqThreadsReflector = MQThreadsReflector(reactContext)
            val mqJS = mqThreadsReflector.getQueue(FIELD_JS_MSG_QUEUE)?.getLooper()
            val mqNativeModules =
                mqThreadsReflector.getQueue(FIELD_NATIVE_MODULES_MSG_QUEUE)?.getLooper()

            IdlingRegistry.getInstance().apply {
                registerLooperAsIdlingResource(mqJS)
                registerLooperAsIdlingResource(mqNativeModules)
            }
        }
    }

    private fun setupUrlBlacklist() {
        if (launchArgs.hasURLBlacklist()) {
            val blacklistUrls = launchArgs.urlBlacklist
            setIldingResourceBlacklist(blacklistUrls)
        }
    }

    private fun setupCustomRNIdlingResources() {
        rnBridgeIdlingResource = BridgeIdlingResource(reactContext)
        timersIdlingResource = TimersIdlingResource(getInterrogationStrategy(reactContext)!!)
        uiModuleIdlingResource = UIModuleIdlingResource(reactContext)
        animIdlingResource = AnimatedModuleIdlingResource(reactContext)

        IdlingRegistry.getInstance()
            .register(
                timersIdlingResource,
                rnBridgeIdlingResource,
                uiModuleIdlingResource,
                animIdlingResource)

        if (networkSyncEnabled) {
            setupNetworkIdlingResource()
        }
        setupAsyncStorageIdlingResource()
    }

    private fun syncIdlingResources() {
        IdlingRegistry.getInstance().apply {
            val irr: IdlingResourceRegistry =
                Reflect.on(Espresso::class.java).field("baseRegistry").get()
            irr.sync(this.resources, this.loopers)
        }
    }

    private fun unregisterMQThreadsInterrogators() {
        val idlingResourceInstance = IdlingRegistry.getInstance()
        val loopersField = Reflect.on(idlingResourceInstance).field("loopers")
        loopersField.get<MutableSet<Any>>().clear()
    }

    private fun unregisterCustomRNIdlingResources() {
        IdlingRegistry.getInstance()
            .unregister(
                timersIdlingResource,
                rnBridgeIdlingResource,
                uiModuleIdlingResource,
                animIdlingResource
            )
        rnBridgeIdlingResource?.onDetach()

        removeNetworkIdlingResource()
        removeAsyncStorageIdlingResource()
    }

    private fun setupAsyncStorageIdlingResource() {
        asyncStorageIdlingResource =
            AsyncStorageIdlingResource.createIfNeeded(reactContext, false)?.also {
                IdlingRegistry.getInstance().register(it)
            }

        legacyAsyncStorageIdlingResource =
            AsyncStorageIdlingResource.createIfNeeded(reactContext, true)?.also {
                IdlingRegistry.getInstance().register(it)
            }
    }

    private fun removeAsyncStorageIdlingResource() {
        asyncStorageIdlingResource?.also {
            IdlingRegistry.getInstance().unregister(it)
        }

        legacyAsyncStorageIdlingResource?.also {
            IdlingRegistry.getInstance().unregister(it)
        }
    }

    private fun setupNetworkIdlingResource() {
        try {
            networkIdlingResource = NetworkIdlingResource(reactContext)
            IdlingRegistry.getInstance().register(networkIdlingResource)
        } catch (e: ReflectException) {
            Log.e(LOG_TAG, "Can't set up Networking Module listener", e)
        }
    }

    private fun removeNetworkIdlingResource() {
        networkIdlingResource?.let {
            it.pause()
            IdlingRegistry.getInstance().unregister(it)
            networkIdlingResource = null
        }
    }

    private fun toFormattedUrlArray(urlList: String): List<String> {
        var formattedUrls = urlList
        formattedUrls = formattedUrls.replace(Regex("""[()"]"""), "")
        formattedUrls = formattedUrls.trim()
        return formattedUrls.split(',')
    }
}
