package com.wix.detox.reactnative

import android.app.Activity
import android.content.Context
import android.util.Log
import androidx.test.platform.app.InstrumentationRegistry
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.ReactContext

private const val LOG_TAG = "DetoxRNExt"

object ReactNativeExtension {
    private var rnIdlingResources: ReactNativeIdlingResources? = null

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

            setupIdlingResources(reactContext, networkSyncEnabled)
            hackRN50OrHigherWaitForReady()
        }
    }

    /**
     * Wait for React-Native to finish loading (i.e. make RN context available).
     *
     * @param applicationContext The app context, implicitly assumed to be a [ReactApplication] instance.
     */
    @JvmStatic
    fun waitForRNBootstrap(applicationContext: Context) {
        if (!ReactNativeInfo.isReactNativeApp()) {
            return
        }

        (applicationContext as ReactApplication).let {
            val reactContext = awaitNewReactNativeContext(it, null)

            setupIdlingResources(reactContext)
            hackRN50OrHigherWaitForReady()
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
    fun toggleNetworkSynchronization(enable: Boolean) {
        if (!ReactNativeInfo.isReactNativeApp()) {
            return
        }

        rnIdlingResources?.setNetworkSynchronization(enable)
    }

    @JvmStatic
    fun toggleTimersSynchronization(enable: Boolean) {
        rnIdlingResources?.let {
            if (enable) it.resumeRNTimersIdlingResource() else it.pauseRNTimersIdlingResource()
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

    private fun setupIdlingResources(reactContext: ReactContext, networkSyncEnabled: Boolean = true) {
        rnIdlingResources = ReactNativeIdlingResources(reactContext, networkSyncEnabled).apply {
            registerAll()
        }
    }

    private fun hackRN50OrHigherWaitForReady() {
        if (ReactNativeInfo.rnVersion().minor >= 50) {
            try {
                //TODO- Temp hack to make Detox usable for RN>=50 till we find a better sync solution.
                Thread.sleep(1000)
            } catch (e: InterruptedException) {
                e.printStackTrace()
            }

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
