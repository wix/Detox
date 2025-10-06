package com.wix.detox.inquiry

import android.util.Log
import android.view.View
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.fabric.mounting.SurfaceMountingManager
import com.wix.detox.inquiry.ViewLifecycleRegistry.markAnimated
import com.wix.detox.inquiry.ViewLifecycleRegistry.markMounted
import com.wix.detox.inquiry.ViewLifecycleRegistry.markUpdated
import com.wix.detox.inquiry.ViewLifecycleRegistry.markCustomEvent

/**
 * Hook into React Native's Fabric new architecture to track view lifecycle events.
 * This hooks into the exact points where views are mounted, updated, and animated.
 */
object DetoxFabricAnimationHook {
    private const val LOG_TAG = "DetoxFabricHook"

    /**
     * Hook into IntBufferBatchMountItem.execute() to track animated view updates.
     * This is called when animated props are applied to views in Fabric.
     */
    fun hookIntBufferBatchMountItem(
        viewTag: Int,
        props: ReadableMap?,
        surfaceMountingManager: SurfaceMountingManager
    ) {
        try {
            // Get the actual Android View
            val androidView = getViewByTag(surfaceMountingManager, viewTag)
            if (androidView == null) {
                Log.d(LOG_TAG, "View not found for tag: $viewTag")
                return
            }

            // Check if this is an animated update
            if (isAnimatedPropsUpdate(props)) {
                Log.d(LOG_TAG, "Animated props update for view tag: $viewTag")
                markAnimated(androidView)

                // Log problematic animations
                if (isProblematicAnimation(props)) {
                    Log.w(LOG_TAG, "Problematic animation detected for view tag: $viewTag")
                    markCustomEvent(androidView, "problematic_animation")
                }
            } else {
                // Regular props update
                markUpdated(androidView)
            }

        } catch (e: Exception) {
            Log.w(LOG_TAG, "Failed to hook animated view update", e)
        }
    }

    /**
     * Hook into view mount operations to track when views are created.
     */
    fun hookViewMount(
        viewTag: Int,
        surfaceMountingManager: SurfaceMountingManager
    ) {
        try {
            val androidView = getViewByTag(surfaceMountingManager, viewTag)
            if (androidView != null) {
                Log.d(LOG_TAG, "View mounted with tag: $viewTag")
                markMounted(androidView)
            }
        } catch (e: Exception) {
            Log.w(LOG_TAG, "Failed to hook view mount", e)
        }
    }

    /**
     * Get Android View by React Native view tag using reflection.
     * This works around the fact that SurfaceMountingManager doesn't expose a direct getView method.
     */
    private fun getViewByTag(
        surfaceMountingManager: SurfaceMountingManager,
        viewTag: Int
    ): View? {
        return try {
            // Use reflection to access the internal view registry
            val viewRegistryField = surfaceMountingManager.javaClass.getDeclaredField("mViewRegistry")
            viewRegistryField.isAccessible = true
            val viewRegistry = viewRegistryField.get(surfaceMountingManager)

            // Get the view from the registry
            val getViewMethod = viewRegistry.javaClass.getMethod("getView", Int::class.java)
            getViewMethod.invoke(viewRegistry, viewTag) as? View
        } catch (e: Exception) {
            Log.w(LOG_TAG, "Failed to get view by tag: $viewTag", e)
            null
        }
    }

    /**
     * Check if this is an animated props update by looking for animated properties.
     */
    private fun isAnimatedPropsUpdate(props: ReadableMap?): Boolean {
        if (props == null) return false

        val animatedKeys = setOf(
            "transform", "opacity", "scaleX", "scaleY", "scale",
            "translateX", "translateY", "rotateX", "rotateY", "rotateZ",
            "backgroundColor", "borderRadius", "borderWidth"
        )

        val iterator = props.keySetIterator()
        while (iterator.hasNextKey()) {
            val key = iterator.nextKey()
            if (animatedKeys.any { key.contains(it, ignoreCase = true) }) {
                return true
            }
        }

        return false
    }

    /**
     * Check if this animation might be problematic (infinite loops, conflicting animations, etc.).
     */
    private fun isProblematicAnimation(props: ReadableMap?): Boolean {
        if (props == null) return false

        // Check for potential infinite loop patterns
        val transformKeys = mutableSetOf<String>()
        val iterator = props.keySetIterator()

        while (iterator.hasNextKey()) {
            val key = iterator.nextKey()
            if (key.contains("transform", ignoreCase = true)) {
                transformKeys.add(key)
            }
        }

        // Multiple transform properties might indicate conflicting animations
        if (transformKeys.size > 3) {
            Log.w(LOG_TAG, "Multiple transform properties detected: $transformKeys")
            return true
        }

        // Check for opacity animations that might cause issues
        if (props.hasKey("opacity")) {
            val opacity = props.getDouble("opacity")
            if (opacity < 0.0 || opacity > 1.0) {
                Log.w(LOG_TAG, "Invalid opacity value: $opacity")
                return true
            }
        }

        return false
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
     * Get view coordinates relative to root view
     */
    fun getViewCoordinatesRelativeToRoot(view: View, rootView: View): IntArray {
        val viewCoords = getViewCoordinates(view)
        val rootCoords = getViewCoordinates(rootView)

        return intArrayOf(
            viewCoords[0] - rootCoords[0], // Relative X
            viewCoords[1] - rootCoords[1], // Relative Y
            viewCoords[2],                 // Width
            viewCoords[3]                  // Height
        )
    }

    /**
     * Log current registry statistics
     */
    fun logRegistryStats() {
        val stats = ViewLifecycleRegistry.getStats()
        Log.i(LOG_TAG, "ViewLifecycleRegistry stats: $stats")
    }
}
