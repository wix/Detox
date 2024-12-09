package com.example.utils

import android.content.Context
import com.facebook.react.modules.systeminfo.ReactNativeVersion
import com.facebook.soloader.SoLoader

private const val OpenSourceMergedSoMappingClassName = "com.facebook.react.soloader.OpenSourceMergedSoMapping"
private const val ExternalSoMappingClassName ="com.facebook.soloader.ExternalSoMapping"

object DetoxSoLoader {
    fun init(appContext: Context) {
        if (ReactNativeVersion.VERSION.run { get("minor") as Int } >= 76) {
            val mergedSoMappingClass = Class.forName(OpenSourceMergedSoMappingClassName)
            val externalSoMapping = Class.forName(ExternalSoMappingClassName)
            val initMethod = SoLoader::class.java.getMethod("init", Context::class.java, externalSoMapping)
            initMethod.invoke(null, appContext, mergedSoMappingClass.getDeclaredField("INSTANCE").get(null))
        } else {
            SoLoader.init(appContext, false)
        }
    }
}
