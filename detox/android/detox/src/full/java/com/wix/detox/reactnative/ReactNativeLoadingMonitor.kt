package com.wix.detox.reactnative

import android.app.Instrumentation
import android.os.Debug
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.ReactContext
import com.wix.detox.common.DetoxErrors
import com.wix.detox.config.DetoxConfig
import org.joor.Reflect
import java.lang.reflect.Proxy
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

private const val LOG_TAG = "DetoxRNLoading"

open class ReactNativeLoadingMonitor(
        private val instrumentation: Instrumentation,
        private val rnApplication: ReactApplication,
        private val previousReactContext: ReactContext?,
        private val config: DetoxConfig = DetoxConfig.CONFIG) {
    private val countDownLatch = CountDownLatch(1)

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

                    subscribeAsyncRNContextHandler(rnInstanceManager) {
                        countDownLatch.countDown()
                    }
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

/**
 * This baby bridges over RN's breaking change introduced in version 0.68:
 * `ReactInstanceManager$ReactInstanceEventListener` was extracted onto a separate interface, having
 * `ReactInstanceManager.{add|remove}ReactInstanceEventLister()` changing their signature to use it, accordingly.
 *
 * This made us resort to a solution based on dynamic proxies, because - depending on RN's version (at runtime), we
 * need to dynamically decide what interface we "extend" (or actually shadow) via the proxy.
 *
 * @see RNDiff https://github.com/facebook/react-native/compare/v0.67.4..v0.68.0#diff-2f01f0cd7ff8c9ea58f12ef0eff5fa8250cad144dd5490598d80d8e9e743458aR1009
 * @see DynamicProxies https://docs.oracle.com/javase/8/docs/technotes/guides/reflection/proxy.html
 */
private fun subscribeAsyncRNContextHandler(rnInstanceManager: ReactInstanceManager, onReactContextInitialized: () -> Any) {

    rnInstanceManager.addReactInstanceEventListener(object : ReactInstanceEventListener {
        override fun onReactContextInitialized(context: ReactContext) {
            Log.i(LOG_TAG, "Got new RN-context directly through listener")
            onReactContextInitialized()
            rnInstanceManager.removeReactInstanceEventListener(this)
        }
    })
}
