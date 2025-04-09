package com.wix.detox.reactnative

import android.app.Instrumentation
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.runtime.ReactHostImpl
import com.wix.detox.common.DetoxErrors
import com.wix.detox.config.DetoxConfig
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

private const val LOG_TAG = "DetoxRNLoading"

open class ReactNativeLoadingMonitor(
    private val instrumentation: Instrumentation,
    private val rnApplication: ReactApplication,
    private val previousReactContext: ReactContext?,
    private val config: DetoxConfig = DetoxConfig.CONFIG
) {
    private val countDownLatch = CountDownLatch(1)

    fun getNewContext(): ReactContext? {
        subscribeToNewRNContextUpdates()
        return awaitNewRNContext()
    }

    private fun subscribeToNewRNContextUpdates() {
        instrumentation.runOnMainSync(
            Runnable {
                val reactContext = rnApplication.getCurrentReactContext()
                if (isReactNativeLoaded(reactContext)) {
                    Log.d(LOG_TAG, "Got new RN-context directly and immediately")
                    countDownLatch.countDown()
                    return@Runnable
                }

                subscribeAsyncRNContextHandler() {
                    countDownLatch.countDown()
                }
            })
    }

    private fun awaitNewRNContext(): ReactContext? {
        var i = 0
        while (true) {
            try {
                if (!countDownLatch.await(1, TimeUnit.SECONDS)) {
                    i++
                    if (i >= config.rnContextLoadTimeoutSec) {
                        // First load can take a lot of time. (packager)
                        // Loads afterwards should take less than a second.
                        throw DetoxErrors.DetoxRuntimeException(
                            """Waited for the new RN-context for too long! (${config.rnContextLoadTimeoutSec} seconds)
                                  |If you think that's not long enough, consider applying a custom Detox runtime-config in DetoxTest.runTests()."""
                                .trimMargin()
                        )
                    }
                } else {
                    break
                }

                // Due to timing in RN
                // it is possible that our listener won't be ever called
                // That's why we have to check the reactContext regularly.
                val reactContext = rnApplication.getCurrentReactContext()

                // We also need to wait for rect native instance to be initialized
                if (isReactNativeLoaded(reactContext)) {
                    Log.d(LOG_TAG, "Got new RN-context explicitly while polling (#iteration=$i)")
                    break
                }
            } catch (e: InterruptedException) {
                throw RuntimeException("waiting for new RN-context got interrupted", e)
            }
        }

        return rnApplication.getCurrentReactContext()
    }

    private fun isReactNativeLoaded(reactContext: ReactContext?) =
        reactContext != null && reactContext !== previousReactContext && reactContext.hasActiveReactInstance()

    private fun subscribeAsyncRNContextHandler(onReactContextInitialized: () -> Any) {
        val isFabric = isFabricEnabled()
        if (isFabric) {
            // We do a casting for supporting RN 0.75 and above
            val host = rnApplication.reactHost as ReactHostImpl?
            host?.addReactInstanceEventListener(object : ReactInstanceEventListener {
                override fun onReactContextInitialized(context: ReactContext) {
                    Log.i(LOG_TAG, "Got new RN-context through listener")
                    onReactContextInitialized()
                    host.removeReactInstanceEventListener(this)
                }
            })
        } else {
            val rnInstanceManager = rnApplication.getInstanceManagerSafe()
            rnInstanceManager.addReactInstanceEventListener(object : ReactInstanceEventListener {
                override fun onReactContextInitialized(context: ReactContext) {
                    Log.i(LOG_TAG, "Got new RN-context directly through listener")
                    onReactContextInitialized()
                    rnInstanceManager.removeReactInstanceEventListener(this)
                }
            })
        }
    }
}

