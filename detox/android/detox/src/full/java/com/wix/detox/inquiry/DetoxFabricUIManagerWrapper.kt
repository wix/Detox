package com.wix.detox.inquiry

import android.util.Log
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.fabric.FabricUIManager

/**
 * Wrapper for FabricUIManager that intercepts animation-related calls.
 * This provides a clean way to hook into Fabric's animation system.
 */
class DetoxFabricUIManagerWrapper(
    private val originalUIManager: FabricUIManager
) {
    private val LOG_TAG = "DetoxFabricUIManagerWrapper"

    fun synchronouslyUpdateViewOnUIThread(reactTag: Int, props: ReadableMap?) {
        try {
            // Call the original method first (only if props is not null)
            if (props != null) {
                originalUIManager.synchronouslyUpdateViewOnUIThread(reactTag, props)
            }

            // Then hook our animation tracking
            DetoxFabricAnimationHook.hookSynchronouslyUpdateViewOnUIThread(reactTag, props, originalUIManager)

        } catch (e: Exception) {
            Log.w(LOG_TAG, "Failed to process animated view update", e)
            // Still call the original method to avoid breaking the app (only if props is not null)
            if (props != null) {
                originalUIManager.synchronouslyUpdateViewOnUIThread(reactTag, props)
            }
        }
    }

    // Delegate all other methods to the original UIManager
    fun resolveView(reactTag: Int) = originalUIManager.resolveView(reactTag)
}
