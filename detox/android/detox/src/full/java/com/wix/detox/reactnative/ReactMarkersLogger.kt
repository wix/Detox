package com.wix.detox.reactnative

import android.util.Log
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.bridge.ReactMarkerConstants.*

object ReactMarkersLogger : ReactMarker.MarkerListener {

    private var isLoggerEnabled = false
    
    fun attach() {
        if (ReactNativeInfo.rnVersion().minor >= 71) {
            isLoggerEnabled = true
        } else {
            ReactMarker.addListener(this)
        }
    }

    override fun logMarker(marker: ReactMarkerConstants, p1: String?, p2: Int) {
        if (isLoggerEnabled) {
            when (marker) {
                DOWNLOAD_START,
                DOWNLOAD_END,
                BUILD_REACT_INSTANCE_MANAGER_START,
                BUILD_REACT_INSTANCE_MANAGER_END,
                REACT_BRIDGE_LOADING_START,
                REACT_BRIDGE_LOADING_END,
                REACT_BRIDGELESS_LOADING_START,
                REACT_BRIDGELESS_LOADING_END,
                CREATE_MODULE_START,
                CREATE_MODULE_END,
                NATIVE_MODULE_SETUP_START,
                NATIVE_MODULE_SETUP_END,
                PRE_RUN_JS_BUNDLE_START,
                RUN_JS_BUNDLE_START,
                RUN_JS_BUNDLE_END,
                CONTENT_APPEARED,
                CREATE_CATALYST_INSTANCE_START,
                CREATE_CATALYST_INSTANCE_END,
                DESTROY_CATALYST_INSTANCE_START,
                DESTROY_CATALYST_INSTANCE_END,
                CREATE_REACT_CONTEXT_START,
                CREATE_REACT_CONTEXT_END,
                PROCESS_PACKAGES_START,
                PROCESS_PACKAGES_END -> Log.d("Detox.RNMarker", "$marker ($p1)")
            }
        }
    }
}
