package com.example

import android.app.Application
import android.webkit.WebView
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {
    override val reactNativeHost: ReactNativeHost = DetoxRNHost(this)

    override fun onCreate() {
        super.onCreate()

        SoLoader.init(this,  /* native exopackage */false)
        WebView.setWebContentsDebuggingEnabled(true)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this app.
            load()
        }
    }
}
