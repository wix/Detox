package com.example.utils

import android.app.Application
import android.content.Context
import com.facebook.react.modules.systeminfo.ReactNativeVersion
import com.facebook.soloader.SoLoader

private const val OpenSourceMergedSoMappingClassName = "com.facebook.react.soloader.OpenSourceMergedSoMapping"

object DetoxSoLoader {
    fun init(appContext: Context) {
        if (ReactNativeVersion.VERSION.run { get("minor") as Int } >= 76) {
            val mergedSoMappingClass = Class.forName(OpenSourceMergedSoMappingClassName)
            val initMethod = SoLoader::class.java.getMethod("init", Application::class.java, Class::class.java)
            initMethod.invoke(null, this, mergedSoMappingClass)
        } else {
            SoLoader.init(appContext, false)
        }
    }
}
