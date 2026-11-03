package com.wix.detox.reactnative.idlingresources.network

import android.util.Log
import androidx.test.platform.app.InstrumentationRegistry
import com.facebook.react.modules.network.OkHttpClientFactory
import com.facebook.react.modules.network.OkHttpClientProvider
import okhttp3.Dispatcher
import okhttp3.OkHttpClient
import org.joor.Reflect
import java.util.Collections
import java.util.WeakHashMap

/**
 * Tracks every OkHttpClient created through React Native's [OkHttpClientProvider], so that
 * [NetworkIdlingResource] can synchronize on all of them rather than only the NetworkingModule's
 * own client. Modules such as expo/fetch (the global `fetch` on Expo SDK 56+) build separate
 * clients through the same provider; their traffic is otherwise invisible to synchronization.
 */
object DetoxOkHttpClientTracker {
    private const val LOG_TAG = "Detox"

    // Keyed on the Dispatcher, not the OkHttpClient: consumers routinely derive
    // clients via newBuilder() (which shares the Dispatcher) and drop the
    // original — e.g. expo/fetch stores only its interceptor-decorated
    // derivative. The Dispatcher is the object synchronization cares about, and
    // it stays strongly reachable through ANY client sharing it.
    private val dispatchers = Collections.synchronizedMap(WeakHashMap<Dispatcher, Unit>())
    private var loggedInstallFailure = false

    /**
     * Wraps the app's registered [OkHttpClientFactory] (if any) with a recording delegate.
     * Idempotent, and re-applied on every idle check so a factory the app installs after
     * startup is re-wrapped. If the current factory cannot be read, nothing is installed:
     * replacing an unknown factory could strip app-critical behavior such as TLS pinning.
     */
    fun ensureInstalled() {
        try {
            val current = Reflect.on(OkHttpClientProvider::class.java)
                .field("factory")
                .get<OkHttpClientFactory?>()
            if (current is TrackingFactory) {
                return
            }
            OkHttpClientProvider.setOkHttpClientFactory(TrackingFactory(current))
        } catch (e: Throwable) {
            if (!loggedInstallFailure) {
                loggedInstallFailure = true
                Log.e(
                    LOG_TAG,
                    "Could not inspect OkHttpClientProvider's factory; only the " +
                        "NetworkingModule client will be network-synchronized",
                    e
                )
            }
        }
    }

    fun dispatchers(): List<Dispatcher> {
        ensureInstalled()
        synchronized(dispatchers) {
            return dispatchers.keys.toList()
        }
    }

    private class TrackingFactory(private val delegate: OkHttpClientFactory?) : OkHttpClientFactory {
        override fun createNewNetworkModuleClient(): OkHttpClient {
            // Without a delegate, replicate the provider's default for its Context overload
            // (the one RN and Expo modules call).
            val client = delegate?.createNewNetworkModuleClient()
                ?: OkHttpClientProvider.createClientBuilder(
                    InstrumentationRegistry.getInstrumentation().targetContext.applicationContext
                ).build()
            dispatchers[client.dispatcher] = Unit
            return client
        }
    }
}
