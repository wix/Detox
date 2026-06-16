package com.wix.detox.reactnative

import android.app.Activity
import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.test.platform.app.InstrumentationRegistry
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.wix.detox.LaunchArgs
import com.wix.detox.reactnative.idlingresources.ReactNativeIdlingResources
import com.wix.detox.reactnative.reloader.ReactNativeReloaderFactory

private const val LOG_TAG = "DetoxRNExt"

object ReactNativeExtension {
    private var rnIdlingResources: ReactNativeIdlingResources? = null
    private var backPressCallbackRegistered = false

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
            registerBackPressCallbackIfNeeded(applicationContext, it)
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
            backPressCallbackRegistered = false

            val previousReactContext = it.getCurrentReactContext()

            reloadReactNativeInBackground(it)
            awaitNewReactNativeContext(it, previousReactContext)

            enableOrDisableSynchronization(it)
            registerBackPressCallbackIfNeeded(applicationContext, it)
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

    /**
     * On API 35+, the system routes back presses through [OnBackPressedDispatcher] instead of
     * calling [Activity.onBackPressed]. Older RN versions (< 0.83) don't register an
     * [OnBackPressedCallback], so the back press bypasses React Native's BackHandler entirely,
     * causing the activity to finish instead of letting JS handle it.
     *
     * This registers a callback that routes back presses through [ReactInstanceManager.onBackPressed],
     * restoring the expected behavior.
     */
    private fun registerBackPressCallbackIfNeeded(context: Context, reactApp: ReactApplication) {
        if (backPressCallbackRegistered) return
        if (Build.VERSION.SDK_INT < 35) return
        if (ReactNativeInfo.isNewArchitectureOnlyVersion()) return

        val activity = getRNActivity(context) as? ComponentActivity ?: return

        val callback = object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                try {
                    val reactContext = reactApp.getCurrentReactContext()
                    reactContext
                        ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        ?.emit("hardwareBackPress", null)
                        ?: Log.w(LOG_TAG, "ReactContext is null, cannot emit hardwareBackPress")
                } catch (e: Exception) {
                    Log.w(LOG_TAG, "Failed to emit hardwareBackPress", e)
                }
            }
        }

        backPressCallbackRegistered = true
        Handler(Looper.getMainLooper()).post {
            activity.onBackPressedDispatcher.addCallback(activity, callback)
            Log.i(LOG_TAG, "Registered OnBackPressedCallback for legacy RN back press handling")
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
