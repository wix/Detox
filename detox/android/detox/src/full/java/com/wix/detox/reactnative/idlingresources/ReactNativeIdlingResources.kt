package com.wix.detox.reactnative.idlingresources

import android.os.Looper
import android.util.Log
import androidx.test.espresso.Espresso
import androidx.test.espresso.IdlingRegistry
import androidx.test.espresso.base.IdlingResourceRegistry
import com.facebook.react.bridge.ReactContext
import com.wix.detox.LaunchArgs
import com.wix.detox.reactnative.idlingresources.animations.AnimatedModuleIdlingResource
import com.wix.detox.reactnative.idlingresources.bridge.BridgeIdlingResource
import com.wix.detox.reactnative.idlingresources.looper.MQThreadsReflector
import com.wix.detox.reactnative.idlingresources.network.NetworkIdlingResource
import com.wix.detox.reactnative.idlingresources.storage.AsyncStorageIdlingResource
import com.wix.detox.reactnative.idlingresources.timers.TimersIdlingResource
import com.wix.detox.reactnative.idlingresources.uimodule.UIModuleIdlingResource
import org.joor.Reflect


private enum class IdlingResourcesName {
    Timers,
    AsyncStorage,
    RNBridge,
    UIModule,
    Animations,
    Network
}

private enum class LooperName {
    JS,
    NativeModules
}

class ReactNativeIdlingResources(
    private val reactContext: ReactContext,
    private var launchArgs: LaunchArgs,
    internal var networkSyncEnabled: Boolean = true
) {
    companion object {
        const val LOG_TAG = "DetoxRNIdleRes"
    }

    private val idlingResources = mutableMapOf<IdlingResourcesName, DetoxIdlingResource>()
    private val loopers = mutableMapOf<LooperName, Looper>()

    fun registerAll() {
        Log.i(LOG_TAG, "Setting up Espresso Idling Resources for React Native")
        unregisterAll()

        setupUrlBlacklist()
        setupMQThreadsInterrogators()
        syncIdlingResources()
        setupIdlingResources()
        syncIdlingResources()
    }

    fun unregisterAll() {
        unregisterMQThreadsInterrogators()
        unregisterIdlingResources()
    }

    fun setNetworkSynchronization(enable: Boolean) {
        if (networkSyncEnabled == enable) {
            return
        }

        if (enable) {
            setupIdlingResource(IdlingResourcesName.Network)
        } else {
            removeIdlingResource(IdlingResourcesName.Network)
        }
        networkSyncEnabled = enable
    }

    fun pauseNetworkSynchronization() = pauseIdlingResource(IdlingResourcesName.Network)
    fun resumeNetworkSynchronization() {
        if (networkSyncEnabled) {
            resumeIdlingResource(IdlingResourcesName.Network)
        }
    }

    fun pauseRNTimersIdlingResource() = pauseIdlingResource(IdlingResourcesName.Timers)
    fun resumeRNTimersIdlingResource() = resumeIdlingResource(IdlingResourcesName.Timers)
    fun pauseUIIdlingResource() = pauseIdlingResource(IdlingResourcesName.UIModule)
    fun resumeUIIdlingResource() = resumeIdlingResource(IdlingResourcesName.UIModule)

    fun setBlacklistUrls(urlList: String) {
        setIdlingResourceBlacklist(urlList)
    }

    private fun setIdlingResourceBlacklist(urlList: String) {
        val urlArray = toFormattedUrlArray(urlList)
        NetworkIdlingResource.setURLBlacklist(urlArray)
    }

    private fun setupMQThreadsInterrogators() {
        setupMQThreadsInterrogator(LooperName.JS)
        setupMQThreadsInterrogator(LooperName.NativeModules)
    }

    private fun setupUrlBlacklist() {
        if (launchArgs.hasURLBlacklist()) {
            val blacklistUrls = launchArgs.urlBlacklist
            setIdlingResourceBlacklist(blacklistUrls)
        }
    }

    private fun setupMQThreadsInterrogator(looperName: LooperName) {
        val mqThreadsReflector = MQThreadsReflector(reactContext)
        val looper = when (looperName) {
            LooperName.JS -> mqThreadsReflector.getJSMQueue()?.getLooper()
            LooperName.NativeModules -> mqThreadsReflector.getNativeModulesQueue()?.getLooper()
        }

        looper?.let {
            IdlingRegistry.getInstance().registerLooperAsIdlingResource(it)
            loopers[looperName] = it
        }
    }

    private fun setupIdlingResources() {
        setupIdlingResource(IdlingResourcesName.RNBridge)
        setupIdlingResource(IdlingResourcesName.Timers)
        setupIdlingResource(IdlingResourcesName.UIModule)
        setupIdlingResource(IdlingResourcesName.Animations)
        if (networkSyncEnabled) {
            setupIdlingResource(IdlingResourcesName.Network)
        }
        setupIdlingResource(IdlingResourcesName.AsyncStorage)
    }

    private fun syncIdlingResources() {
        IdlingRegistry.getInstance().apply {
            val irr: IdlingResourceRegistry =
                Reflect.on(Espresso::class.java).field("baseRegistry").get()
            irr.sync(this.resources, this.loopers)
        }
    }

    private fun unregisterMQThreadsInterrogators() {
        loopers.values.forEach {
            IdlingRegistry.getInstance().unregisterLooperAsIdlingResource(it)
        }
    }

    private fun unregisterIdlingResources() {
        IdlingResourcesName.entries.forEach {
            removeIdlingResource(it)
        }
    }

    private fun pauseIdlingResource(idlingResourcesName: IdlingResourcesName) {
        val idlingResource = idlingResources[idlingResourcesName]
        idlingResource?.pause()
    }

    private fun resumeIdlingResource(idlingResourcesName: IdlingResourcesName) {
        val idlingResource = idlingResources[idlingResourcesName]
        idlingResource?.resume()
    }

    private fun setupIdlingResource(idlingResourcesName: IdlingResourcesName) {
        val idlingResource:DetoxIdlingResource? = when (idlingResourcesName) {
            IdlingResourcesName.Timers -> TimersIdlingResource(reactContext)
            IdlingResourcesName.AsyncStorage -> AsyncStorageIdlingResource.createIfNeeded(reactContext)
            IdlingResourcesName.RNBridge -> BridgeIdlingResource(reactContext)
            IdlingResourcesName.UIModule -> UIModuleIdlingResource(reactContext)
            IdlingResourcesName.Animations -> AnimatedModuleIdlingResource(reactContext)
            IdlingResourcesName.Network -> NetworkIdlingResource(reactContext)
        }

        idlingResource?.let {
            IdlingRegistry.getInstance().register(it)
            idlingResources[idlingResourcesName] = it
        }
    }

    private fun removeIdlingResource(idlingResourcesName: IdlingResourcesName) {
        val idlingResource = idlingResources[idlingResourcesName]
        idlingResource?.let {
            IdlingRegistry.getInstance().unregister(it)
            idlingResource.onUnregistered()
            idlingResources.remove(idlingResourcesName)
        }
    }

    private fun toFormattedUrlArray(urlList: String): List<String> {
        var formattedUrls = urlList
        formattedUrls = formattedUrls.replace(Regex("""[()"]"""), "")
        formattedUrls = formattedUrls.trim()
        return formattedUrls.split(',')
    }
}
