package com.wix.detox.reactnative

import android.app.Activity
import android.content.Context
import android.util.Log
import androidx.test.platform.app.InstrumentationRegistry
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.ReactContext
import com.wix.detox.LaunchArgs
import com.wix.detox.reactnative.idlingresources.ReactNativeIdlingResources
import com.wix.detox.reactnative.reloader.ReactNativeReloaderFactory

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
            awaitNewReactNativeContext(it, null)

            enableOrDisableSynchronization(it)
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
            clearIdlingResources()

            val previousReactContext = it.getCurrentReactContext()

            reloadReactNativeInBackground(it)
            awaitNewReactNativeContext(it, previousReactContext)

            enableOrDisableSynchronization(it)
        }
    }

    @JvmStatic
    fun setBlacklistUrls(blacklistUrls: String) {
        rnIdlingResources?.setBlacklistUrls(blacklistUrls)
    }

    @JvmStatic
    fun enableAllSynchronization(applicationContext: ReactApplication) {
        setupIdlingResources(applicationContext)
    }

    @JvmStatic
    fun clearAllSynchronization() = clearIdlingResources()

    @JvmStatic
    fun getRNActivity(applicationContext: Context): Activity? {
        if (ReactNativeInfo.isReactNativeApp()) {
            return (applicationContext as ReactApplication).getCurrentReactContext()?.currentActivity
        }
        return null
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
        val rnReloader = ReactNativeReloaderFactory(InstrumentationRegistry.getInstrumentation(), reactApplication).create()
        rnReloader.reloadInBackground()
    }

    private fun awaitNewReactNativeContext(
        reactApplication: ReactApplication,
        previousReactContext: ReactContext?
    ): ReactContext {
        val rnLoadingMonitor = ReactNativeLoadingMonitor(
            InstrumentationRegistry.getInstrumentation(),
            reactApplication,
            previousReactContext
        )
        return rnLoadingMonitor.getNewContext()!!
    }

    private fun enableOrDisableSynchronization(reactApplication: ReactApplication) {
        if (shouldDisableSynchronization()) {
            clearAllSynchronization()
        } else {
            setupIdlingResources(reactApplication)
        }
    }

    private fun shouldDisableSynchronization(): Boolean {
        val launchArgs = LaunchArgs()
        return launchArgs.hasEnableSynchronization() && launchArgs.enableSynchronization.equals("0")
    }

    private fun setupIdlingResources(reactApplication: ReactApplication) {
        val launchArgs = LaunchArgs()

        rnIdlingResources = ReactNativeIdlingResources(reactApplication, launchArgs).apply {
            registerAll()
        }
    }

    private fun clearIdlingResources() {
        rnIdlingResources?.unregisterAll()
        rnIdlingResources = null
    }

}
