package com.example

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost

internal class DetoxRNHost(application: Application) : DefaultReactNativeHost(application) {

    override fun getUseDeveloperSupport(): Boolean {
        return BuildConfig.DEBUG
    }

    override val isNewArchEnabled: Boolean
        get() = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED

    override val isHermesEnabled: Boolean
        get() = BuildConfig.IS_HERMES_ENABLED

    override fun getPackages(): List<ReactPackage> = PackageList(this).packages.apply {
        add(NativeModulePackage())
    }
}
