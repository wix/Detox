package com.wix.detox.reactnative

import android.app.Instrumentation
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.ReactContext
import com.wix.detox.common.DetoxErrors
import com.wix.detox.config.DetoxConfig
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

private const val LOG_TAG = "DetoxRNLoading"

open class ReactNativeLoadingMonitor(
        private val instrumentation: Instrumentation,
        private val rnApplication: ReactApplication,
        private val previousReactContext: ReactContext?,
        private val config: DetoxConfig = DetoxConfig.CONFIG) {
    val countDownLatch = CountDownLatch(1)

    fun getNewContext(): ReactContext? {
        subscribeToNewRNContextUpdates()
        return awaitNewRNContext()
    }

    private fun subscribeToNewRNContextUpdates() {
        instrumentation.runOnMainSync(
                Runnable {
                    val rnInstanceManager = rnApplication.reactNativeHost.reactInstanceManager
                    val reactContext = rnInstanceManager.currentReactContext
                    if (reactContext != null && reactContext !== previousReactContext) {
                        Log.d(LOG_TAG, "Got new RN-context directly and immediately")
                        countDownLatch.countDown()
                        return@Runnable
                    }

                    rnInstanceManager.addReactInstanceEventListener(object : ReactInstanceManager.ReactInstanceEventListener {
                        override fun onReactContextInitialized(context: ReactContext) {
                            Log.i(LOG_TAG, "Got new RN-context async'ly through listener")
                            rnInstanceManager.removeReactInstanceEventListener(this)
                            countDownLatch.countDown()
                        }
                    })
                })
    }

    private fun awaitNewRNContext(): ReactContext? {
        val rnInstanceManager = rnApplication.reactNativeHost.reactInstanceManager

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
                                .trimMargin())
                    }
                } else {
                    break
                }

                // Due to an ugly timing issue in RN
                // it is possible that our listener won't be ever called
                // That's why we have to check the reactContext regularly.
                val reactContext = rnInstanceManager.currentReactContext
                if (reactContext != null && reactContext !== previousReactContext) {
                    Log.d(LOG_TAG, "Got new RN-context explicitly while polling (#iteration=$i)")
                    break
                }
            } catch (e: InterruptedException) {
                throw RuntimeException("waiting for new RN-context got interrupted", e)
            }
        }

        return rnInstanceManager.currentReactContext
    }
}
