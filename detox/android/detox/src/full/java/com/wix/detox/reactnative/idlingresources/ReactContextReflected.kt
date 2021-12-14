package com.wix.detox.reactnative.idlingresources

import android.util.Log
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.ReactContext
import com.wix.detox.common.DetoxLog.Companion.LOG_TAG
import org.joor.Reflect

private const val FIELD_CATALYST_INSTANCE = "mCatalystInstance"
private const val CLASS_UI_MANAGER_MODULE = "com.facebook.react.uimanager.UIManagerModule"
private const val METHOD_HAS_NATIVE_MODULE = "hasNativeModule"

class ReactContextReflected(private val reactContext: ReactContext) {
    fun getCatalystInstance(): CatalystInstance? {
        return try {
            Reflect.on(reactContext).field(FIELD_CATALYST_INSTANCE).get<CatalystInstance>()
        } catch (e: Exception) {
            Log.e(LOG_TAG, "failed to get $FIELD_CATALYST_INSTANCE ", e.cause)
            null
        }
    }

    fun hasNativeModule(): Boolean {
        return try {
            val uiModuleClass = Class.forName(CLASS_UI_MANAGER_MODULE)
            Reflect.on(reactContext)
                .call(METHOD_HAS_NATIVE_MODULE, uiModuleClass).get<Boolean>()
        } catch (e: Exception) {
            Log.e(LOG_TAG, "UIManagerModule is not on classpath. ", e)
            false
        }
    }
}