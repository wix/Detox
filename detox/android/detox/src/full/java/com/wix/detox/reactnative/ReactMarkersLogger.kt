package com.wix.detox.reactnative

import android.util.Log
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.bridge.ReactMarkerConstants.*

object ReactMarkersLogger : ReactMarker.MarkerListener {

    fun attach() {
        if (ReactNativeInfo.rnVersion().minor >= 71) {
            ReactMarker.addListener(this)
        }
    }

    override fun logMarker(marker: ReactMarkerConstants, p1: String?, p2: Int) {
        when {
            marker == DOWNLOAD_START ||
            marker == DOWNLOAD_END ||
            marker == BUILD_REACT_INSTANCE_MANAGER_START ||
            marker == BUILD_REACT_INSTANCE_MANAGER_END ||
            marker == REACT_BRIDGE_LOADING_START ||
            marker == REACT_BRIDGE_LOADING_END ||
            marker == REACT_BRIDGELESS_LOADING_START ||
            marker == REACT_BRIDGELESS_LOADING_END ||
            marker == CREATE_MODULE_START ||
            marker == CREATE_MODULE_END ||
            marker == NATIVE_MODULE_SETUP_START ||
            marker == NATIVE_MODULE_SETUP_END ||
            marker == PRE_RUN_JS_BUNDLE_START ||
            marker == RUN_JS_BUNDLE_START ||
            marker == RUN_JS_BUNDLE_END ||
            marker == CONTENT_APPEARED ||
            marker == CREATE_CATALYST_INSTANCE_START ||
            marker == CREATE_CATALYST_INSTANCE_END ||
            marker == DESTROY_CATALYST_INSTANCE_START ||
            marker == DESTROY_CATALYST_INSTANCE_END ||
            marker == CREATE_REACT_CONTEXT_START ||
            marker == CREATE_REACT_CONTEXT_END ||
            marker == PROCESS_PACKAGES_START ||
            marker == PROCESS_PACKAGES_END ||
                false ->
                Log.d("Detox.RNMarker", "$marker ($p1)")
        }
    }
}
