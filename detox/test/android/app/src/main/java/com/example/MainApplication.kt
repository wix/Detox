package com.example

import android.app.Application
import android.webkit.WebView
import com.example.utils.DetoxSoLoader
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

    @Deprecated("The old architecture is no longer supported. Keep it for BW compatibility.")
    override val reactNativeHost: ReactNativeHost
        get() = throw IllegalStateException(
            "The old architecture is no longer supported"
        )

    override val reactHost: ReactHost
        get() = getDefaultReactHost(context = applicationContext, packageList = PackageList(this).packages.apply {
            add(NativeModulePackage())
        })

    override fun onCreate() {
        super.onCreate()
        DetoxSoLoader.init(this)

        WebView.setWebContentsDebuggingEnabled(true)
        loadReactNative(this)
    }
}
