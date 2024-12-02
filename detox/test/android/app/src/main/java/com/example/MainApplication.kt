package com.example

import android.app.Application
import android.webkit.WebView
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {
    override val reactNativeHost: ReactNativeHost = DetoxRNHost(this)

    override fun onCreate() {
        super.onCreate()

        SoLoader.init(this,  /* native exopackage */false)
        WebView.setWebContentsDebuggingEnabled(true)
    }
}
