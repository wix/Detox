package com.wix.detox.reactnative.idlingresources.network

import android.util.Log
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.network.NetworkingModule
import com.wix.detox.reactnative.ReactNativeInfo
import okhttp3.OkHttpClient
import org.joor.Reflect
import org.joor.ReflectException


private const val LOG_TAG = "RNNetworkingModuleRefl"

private const val FIELD_OKHTTP_CLIENT_PRE80 = "mClient"
private const val FIELD_OKHTTP_CLIENT = "client"

internal class NetworkingModuleReflected(private val reactContext: ReactContext) {
    fun getHttpClient(): OkHttpClient? {
        val networkNativeModule = reactContext.getNativeModule(NetworkingModule::class.java)
        try {
            val fieldName = if ( ReactNativeInfo.rnVersion().minor > 79) {
                FIELD_OKHTTP_CLIENT
            } else {
                FIELD_OKHTTP_CLIENT_PRE80
            }

            return Reflect.on(networkNativeModule).field(fieldName).get()
        } catch (e: ReflectException) {
            Log.e(LOG_TAG, "Can't set up Networking Module listener", e)
            return null
        }
    }
}
