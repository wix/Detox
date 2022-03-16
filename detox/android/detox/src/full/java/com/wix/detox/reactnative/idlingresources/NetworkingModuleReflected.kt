package com.wix.detox.reactnative.idlingresources

import android.util.Log
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.network.NetworkingModule
import okhttp3.OkHttpClient
import org.joor.Reflect
import org.joor.ReflectException

internal class NetworkingModuleReflected(private val reactContext: ReactContext) {
    fun getHttpClient(): OkHttpClient? {
        if (reactContext.hasNativeModule(NetworkingModule::class.java)) {
            val networkNativeModule = reactContext.getNativeModule(NetworkingModule::class.java)
            try {
                return Reflect.on(networkNativeModule).field(FIELD_OKHTTP_CLIENT).get()
            } catch (e: ReflectException) {
                Log.e(LOG_TAG, "Can't set up Networking Module listener", e)
            }
        }
        return null
    }

    companion object {
        private const val LOG_TAG = "RNNetworkingModuleRefl"

        private const val FIELD_OKHTTP_CLIENT = "mClient"
    }
}
