package com.wix.detox.reactnative

import android.app.Activity
import android.content.Context
import android.util.Log
import androidx.test.platform.app.InstrumentationRegistry
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.ReactContext
import com.wix.detox.LaunchArgs

private const val LOG_TAG = "DetoxRNExt"

object ReactNativeExtension {
    private var rnIdlingResources: ReactNativeIdlingResources? = null

    fun initIfNeeded() {
        if (!ReactNativeInfo.isReactNativeApp()) {
            return
        }

        ReactMarkersLogger.attach()
    }

    /**
     * Wait for React-Native to finish loading (i.e. make RN context available).
     *
     * @param applicationContext The app context, implicitly assumed to be a [ReactApplication] instance.
     */
    fun waitForRNBootstrap(applicationContext: Context) {
        if (!ReactNativeInfo.isReactNativeApp()) {
            return
        }

        (applicationContext as ReactApplication).let {
            val reactContext = awaitNewReactNativeContext(it, null)

            enableOrDisableSynchronization(reactContext)
        }
    }

    /**
     * Reloads the React Native context and thus all javascript code.
     *
     * It is a lot faster to reload a React Native application this way,
     * than to reload the whole Activity or Application.
     *
     * @param applicationContext The app context, implicitly assumed to be a [ReactApplication] instance.
     */
    @JvmStatic
    fun reloadReactNative(applicationContext: Context) {
        if (!ReactNativeInfo.isReactNativeApp()) {
            return
        }

        Log.i(LOG_TAG, "Reloading React Native")

        (applicationContext as ReactApplication).let {
            val networkSyncEnabled = rnIdlingResources?.networkSyncEnabled ?: true
            clearIdlingResources()

            val previousReactContext = getCurrentReactContextSafe(it)

            reloadReactNativeInBackground(it)
            val reactContext = awaitNewReactNativeContext(it, previousReactContext)

            enableOrDisableSynchronization(reactContext, networkSyncEnabled)
        }
    }

    @JvmStatic
    fun setBlacklistUrls(blacklistUrls: String) {
        rnIdlingResources?.setBlacklistUrls(blacklistUrls)
    }

    @JvmStatic
    fun enableAllSynchronization(applicationContext: ReactApplication) {
        val reactContext = getCurrentReactContextSafe(applicationContext)

        if (reactContext != null) {
            setupIdlingResources(reactContext)
        }
    }

    @JvmStatic
    fun clearAllSynchronization() = clearIdlingResources()

    @JvmStatic
    fun getRNActivity(applicationContext: Context): Activity? {
        if (ReactNativeInfo.isReactNativeApp()) {
            return getCurrentReactContextSafe(applicationContext as ReactApplication)?.currentActivity
        }
        return null
    }

    @JvmStatic
    fun setNetworkSynchronization(enable: Boolean) {
        rnIdlingResources?.setNetworkSynchronization(enable)
    }

    @JvmStatic
    fun toggleNetworkSynchronization(enable: Boolean) {
        rnIdlingResources?.let {
            if (enable) it.resumeNetworkSynchronization() else it.pauseNetworkSynchronization()
        }
    }

    @JvmStatic
    fun toggleTimersSynchronization(enable: Boolean) {
        rnIdlingResources?.let {
            if (enable) it.resumeRNTimersIdlingResource() else it.pauseRNTimersIdlingResource()
        }
    }

    @JvmStatic
    fun toggleUISynchronization(enable: Boolean) {
        rnIdlingResources?.let {
            if (enable) it.resumeUIIdlingResource() else it.pauseUIIdlingResource()
        }
    }

    private fun reloadReactNativeInBackground(reactApplication: ReactApplication) {
        val rnReloader = ReactNativeReLoader(InstrumentationRegistry.getInstrumentation(), reactApplication)
        rnReloader.reloadInBackground()
    }

    private fun awaitNewReactNativeContext(reactApplication: ReactApplication, previousReactContext: ReactContext?): ReactContext {
        val rnLoadingMonitor = ReactNativeLoadingMonitor(InstrumentationRegistry.getInstrumentation(), reactApplication, previousReactContext)
        return rnLoadingMonitor.getNewContext()!!
    }

    private fun enableOrDisableSynchronization(reactContext: ReactContext, networkSyncEnabled: Boolean = true) {
        if (shouldDisableSynchronization()) {
            clearAllSynchronization()
        } else {
            setupIdlingResources(reactContext, networkSyncEnabled)
        }
    }

    private fun shouldDisableSynchronization(): Boolean {
        val launchArgs = LaunchArgs()
        return launchArgs.hasEnableSynchronization() && launchArgs.enableSynchronization.equals("0")
    }

    private fun setupIdlingResources(reactContext: ReactContext, networkSyncEnabled: Boolean = true) {
        val launchArgs = LaunchArgs()

        rnIdlingResources = ReactNativeIdlingResources(reactContext, launchArgs, networkSyncEnabled).apply {
            registerAll()
        }
    }

    private fun clearIdlingResources() {
        rnIdlingResources?.unregisterAll()
        rnIdlingResources = null
    }

    private fun getInstanceManagerSafe(reactApplication: ReactApplication): ReactInstanceManager {
        return reactApplication.reactNativeHost.reactInstanceManager
                ?: throw RuntimeException("ReactInstanceManager is null!")
    }

    private fun getCurrentReactContextSafe(reactApplication: ReactApplication): ReactContext? {
        return getInstanceManagerSafe(reactApplication).currentReactContext
    }
}
