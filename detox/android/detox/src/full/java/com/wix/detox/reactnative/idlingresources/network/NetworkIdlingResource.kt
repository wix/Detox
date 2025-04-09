package com.wix.detox.reactnative.idlingresources.network

import android.util.Log
import android.view.Choreographer
import androidx.test.espresso.IdlingResource.ResourceCallback
import com.facebook.react.bridge.ReactContext
import com.wix.detox.reactnative.idlingresources.DetoxIdlingResource
import okhttp3.Dispatcher
import java.util.regex.Pattern
import java.util.regex.PatternSyntaxException

/**
 * Created by simonracz on 09/10/2017.
 *
 * Idling Resource which monitors React Native's OkHttpClient.
 *
 *
 * Must call stop() on it, before removing it from Espresso.
 */
class NetworkIdlingResource(private val dispatcher: Dispatcher) : DetoxIdlingResource(),
    Choreographer.FrameCallback {
    private val busyResources: MutableSet<String> = HashSet()

    constructor(reactContext: ReactContext) : this(NetworkingModuleReflected(reactContext).getHttpClient()!!.dispatcher)

    override fun getName(): String {
        return NetworkIdlingResource::class.java.name
    }

    override fun getDebugName(): String {
        return "network"
    }

    @Synchronized
    override fun getBusyHint(): Map<String, Any> = mapOf("urls" to ArrayList(busyResources))

    override fun registerIdleTransitionCallback(callback: ResourceCallback?) {
        super.registerIdleTransitionCallback(callback)
        Choreographer.getInstance().postFrameCallback(this)
    }

    override fun onUnregistered() {
        super.onUnregistered()
        Choreographer.getInstance().removeFrameCallback(this)
    }

    override fun doFrame(frameTimeNanos: Long) {
        isIdleNow
    }

    @Synchronized
    override fun checkIdle(): Boolean {
        busyResources.clear()

        val calls = dispatcher.runningCalls()
        for (call in calls) {
            val url = call.request().url.toString()

            if (!isUrlBlacklisted(url)) {
                busyResources.add(url)
            }
        }

        if (busyResources.isNotEmpty()) {
            Log.i(LOG_TAG, "Network is busy, with " + busyResources.size + " in-flight calls")
            Choreographer.getInstance().postFrameCallback(this)
            return false
        }

        notifyIdle()
        return true
    }

    private fun isUrlBlacklisted(url: String): Boolean {
        for (pattern in blacklist) {
            if (pattern.matcher(url).matches()) {
                return true
            }
        }
        return false
    }

    companion object {
        private const val LOG_TAG = "Detox"

        private val blacklist = ArrayList<Pattern>()

        /**
         * Must be called on the UI thread.
         *
         * @param urls list of regexes of blacklisted urls
         */
        @JvmStatic
        fun setURLBlacklist(urls: List<String>?) {
            blacklist.clear()
            if (urls == null) return

            for (url in urls) {
                try {
                    blacklist.add(Pattern.compile(url))
                } catch (e: PatternSyntaxException) {
                    Log.e(
                        LOG_TAG,
                        "Couldn't parse regular expression for Black list url: $url", e
                    )
                }
            }
        }
    }
}
