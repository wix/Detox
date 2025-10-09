package com.wix.detox.inquiry

import android.util.Log
import android.view.View
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.fabric.FabricUIManager
import com.wix.detox.inquiry.ViewLifecycleRegistry.markAnimated
import com.wix.detox.inquiry.ViewLifecycleRegistry.markMounted
import com.wix.detox.inquiry.ViewLifecycleRegistry.markUpdated

/**
 * Hook into React Native's Fabric new architecture to track animated views.
 * This provides precise tracking by intercepting the exact points where animated
 * properties are applied to views in Fabric.
 */
object DetoxFabricAnimationHook {
    private const val LOG_TAG = "DetoxFabricHook"

    /**
     * Hook into FabricUIManager.synchronouslyUpdateViewOnUIThread to track animated updates.
     * This marks views as animated whenever there's any animation activity, giving lots of false positives.
     */
    fun hookSynchronouslyUpdateViewOnUIThread(
        reactTag: Int,
        props: ReadableMap?,
        fabricUIManager: FabricUIManager
    ) {
        try {
            // Get the actual Android View
            val androidView = fabricUIManager.resolveView(reactTag)
            if (androidView == null) {
                Log.d(LOG_TAG, "View not found for tag: $reactTag")
                return
            }

            markAnimated(androidView)
        } catch (e: Exception) {
            Log.w(LOG_TAG, "Failed to hook animated view update", e)
        }
    }

    /**
     * Hook into view mount operations to track when views are created.
     */
    fun hookViewMount(
        reactTag: Int,
        fabricUIManager: FabricUIManager
    ) {
        try {
            val androidView = fabricUIManager.resolveView(reactTag)
            if (androidView != null) {
                Log.d(LOG_TAG, "View mounted with tag: $reactTag")
                markMounted(androidView)
            }
        } catch (e: Exception) {
            Log.w(LOG_TAG, "Failed to hook view mount", e)
        }
    }


    /**
     * Get view coordinates for highlighting
     */
    fun getViewCoordinates(view: View): IntArray {
        val coords = intArrayOf(0, 0, 0, 0)
        try {
            view.getLocationOnScreen(coords)
            coords[2] = view.width
            coords[3] = view.height
        } catch (e: Exception) {
            Log.w(LOG_TAG, "Failed to get view coordinates", e)
        }
        return coords
    }

    /**
     * Log current registry statistics
     */
    fun logRegistryStats() {
        val stats = ViewLifecycleRegistry.getStats()
        Log.i(LOG_TAG, "ViewLifecycleRegistry stats: $stats")
    }
}
