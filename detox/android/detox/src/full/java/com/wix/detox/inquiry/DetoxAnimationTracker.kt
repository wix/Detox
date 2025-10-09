package com.wix.detox.inquiry

import android.util.Log
import com.facebook.react.bridge.ReactContext
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.uimanager.UIManagerHelper
// import com.facebook.react.uimanager.UIManagerType

/**
 * Main entry point for Detox animation tracking in Fabric.
 * This provides a simple API to initialize and use the animation tracking system.
 */
object DetoxAnimationTracker {
    private const val LOG_TAG = "DetoxAnimationTracker"
    private var isInitialized = false

    /**
     * Initialize the animation tracking system.
     * This should be called once when Detox starts up.
     */
    fun initialize(reactContext: ReactContext) {
        if (isInitialized) {
            Log.d(LOG_TAG, "DetoxAnimationTracker already initialized")
            return
        }

        try {
            // Initialize the Fabric integration
            DetoxFabricIntegration.initialize(reactContext)
            isInitialized = true
            Log.i(LOG_TAG, "DetoxAnimationTracker initialized successfully")

        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to initialize DetoxAnimationTracker", e)
        }
    }

    /**
     * Get the current animation statistics
     */
    fun getAnimationStats(): Map<String, Any> {
        return ViewLifecycleRegistry.getStats()
    }

    /**
     * Get all recently animated views
     */
    fun getRecentlyAnimatedViews(): List<android.view.View> {
        return ViewLifecycleRegistry.getRecentlyAnimatedViews()
    }

    /**
     * Check if a specific view was recently animated
     */
    fun wasRecentlyAnimated(view: android.view.View): Boolean {
        return ViewLifecycleRegistry.wasRecentlyAnimated(view)
    }

    /**
     * Clear all animation tracking data
     */
    fun clear() {
        ViewLifecycleRegistry.clear()
    }

    /**
     * Check if the tracker is initialized
     */
    fun isInitialized(): Boolean = isInitialized
}
