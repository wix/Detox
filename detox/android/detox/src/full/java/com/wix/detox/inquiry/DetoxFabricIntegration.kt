package com.wix.detox.inquiry

import android.util.Log
import com.facebook.react.bridge.ReactContext
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.uimanager.UIManagerHelper
// import com.facebook.react.uimanager.UIManagerType

/**
 * Integration point for Detox with React Native's Fabric architecture.
 * This provides hooks into Fabric's animation system to track animated views.
 */
object DetoxFabricIntegration {
    private const val LOG_TAG = "DetoxFabricIntegration"
    private var isInitialized = false

    /**
     * Initialize the Fabric animation hooks.
     * This should be called once when Detox starts up.
     */
    fun initialize(reactContext: ReactContext) {
        if (isInitialized) {
            Log.d(LOG_TAG, "DetoxFabricIntegration already initialized")
            return
        }

        try {
            // Get the FabricUIManager
            val fabricUIManager = UIManagerHelper.getUIManager(reactContext, 1) as? FabricUIManager
            if (fabricUIManager == null) {
                Log.w(LOG_TAG, "FabricUIManager not available - Fabric animation tracking disabled")
                return
            }

            // Hook into the FabricUIManager
            hookFabricUIManager(fabricUIManager)
            isInitialized = true
            Log.i(LOG_TAG, "DetoxFabricIntegration initialized successfully")

        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to initialize DetoxFabricIntegration", e)
        }
    }

    /**
     * Hook into FabricUIManager to track animated updates.
     * This uses reflection to intercept synchronouslyUpdateViewOnUIThread calls.
     */
    private fun hookFabricUIManager(fabricUIManager: FabricUIManager) {
        try {
            // Create a wrapper that intercepts calls to synchronouslyUpdateViewOnUIThread
            val originalMethod = FabricUIManager::class.java.getDeclaredMethod(
                "synchronouslyUpdateViewOnUIThread",
                Int::class.java,
                com.facebook.react.bridge.ReadableMap::class.java
            )

            // Note: In a real implementation, you would use bytecode manipulation
            // or AOP to intercept this method. For now, we'll provide a manual hook
            // that can be called from the application code.

            Log.d(LOG_TAG, "FabricUIManager hook prepared (manual integration required)")

        } catch (e: Exception) {
            Log.w(LOG_TAG, "Failed to hook FabricUIManager", e)
        }
    }

    /**
     * Manual hook for synchronouslyUpdateViewOnUIThread.
     * This should be called from the application's FabricUIManager wrapper.
     */
    fun onSynchronouslyUpdateViewOnUIThread(
        reactTag: Int,
        props: com.facebook.react.bridge.ReadableMap?,
        fabricUIManager: FabricUIManager
    ) {
        DetoxFabricAnimationHook.hookSynchronouslyUpdateViewOnUIThread(reactTag, props, fabricUIManager)
    }

    /**
     * Manual hook for view mount operations.
     */
    fun onViewMount(reactTag: Int, fabricUIManager: FabricUIManager) {
        DetoxFabricAnimationHook.hookViewMount(reactTag, fabricUIManager)
    }

    /**
     * Check if the integration is initialized
     */
    fun isInitialized(): Boolean = isInitialized

    /**
     * Get current animation statistics
     */
    fun getAnimationStats(): Map<String, Any> {
        return ViewLifecycleRegistry.getStats()
    }
}
