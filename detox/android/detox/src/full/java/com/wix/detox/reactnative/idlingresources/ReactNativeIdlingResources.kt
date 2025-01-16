package com.wix.detox.reactnative.idlingresources

import android.os.Looper
import android.util.Log
import androidx.test.espresso.Espresso
import androidx.test.espresso.IdlingRegistry
import androidx.test.espresso.base.IdlingResourceRegistry
import com.facebook.react.ReactApplication
import com.wix.detox.LaunchArgs
import com.wix.detox.reactnative.getCurrentReactContext
import com.wix.detox.reactnative.idlingresources.factory.DetoxIdlingResourceFactory
import com.wix.detox.reactnative.idlingresources.factory.IdlingResourcesName
import com.wix.detox.reactnative.idlingresources.factory.LooperName
import com.wix.detox.reactnative.idlingresources.looper.MQThreadsReflector
import com.wix.detox.reactnative.idlingresources.network.NetworkIdlingResource
import kotlinx.coroutines.runBlocking
import org.joor.Reflect


private const val LOG_TAG = "DetoxRNIdleRes"

class ReactNativeIdlingResources(
    private val reactApplication: ReactApplication,
    private var launchArgs: LaunchArgs,
    private val idlingResourcesFactory: DetoxIdlingResourceFactory = DetoxIdlingResourceFactory(reactApplication)
) {

    private val idlingResources = mutableMapOf<IdlingResourcesName, DetoxIdlingResource>()
    private val loopers = mutableMapOf<LooperName, Looper>()

    fun registerAll() {
        runBlocking {
            Log.i(LOG_TAG, "Setting up Espresso Idling Resources for React Native")
            unregisterAll()

            setupUrlBlacklist()
            setupMQThreadsInterrogators()
            syncIdlingResources()
            setupIdlingResources()
            syncIdlingResources()
        }
    }

    fun unregisterAll() {
        unregisterMQThreadsInterrogators()
        unregisterIdlingResources()
    }

    fun pauseNetworkSynchronization() = pauseIdlingResource(IdlingResourcesName.Network)
    fun resumeNetworkSynchronization() {
        resumeIdlingResource(IdlingResourcesName.Network)
    }

    fun pauseRNTimersIdlingResource() = pauseIdlingResource(IdlingResourcesName.Timers)
    fun resumeRNTimersIdlingResource() = resumeIdlingResource(IdlingResourcesName.Timers)
    fun pauseUIIdlingResource() = pauseIdlingResource(IdlingResourcesName.UI)
    fun resumeUIIdlingResource() = resumeIdlingResource(IdlingResourcesName.UI)

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
        reactApplication.getCurrentReactContext()?.let {
            val mqThreadsReflector = MQThreadsReflector(it)
            val looper = when (looperName) {
                LooperName.JS -> mqThreadsReflector.getJSMQueue()?.getLooper()
                LooperName.NativeModules -> mqThreadsReflector.getNativeModulesQueue()?.getLooper()
            }

            looper?.let {
                IdlingRegistry.getInstance().registerLooperAsIdlingResource(it)
                loopers[looperName] = it
            }
        }

    }

    private suspend fun setupIdlingResources() {
        idlingResources.putAll(idlingResourcesFactory.create())
        idlingResources.forEach { (_, idlingResource) ->
            IdlingRegistry.getInstance().register(idlingResource)
        }
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
        loopers.clear()
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
