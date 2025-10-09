package com.wix.detox.inquiry

import android.util.Log
import android.view.View
import java.util.concurrent.ConcurrentHashMap
import java.util.Date

/**
 * Registry to track view lifecycle events like mounting, updating, and animating.
 * This data is used to inject metadata into the XML hierarchy for debugging.
 */
object ViewLifecycleRegistry {
    private const val LOG_TAG = "ViewLifecycleRegistry"

    // Thread-safe maps to store view lifecycle data
    private val mountedViews = ConcurrentHashMap<View, Date>()
    private val updatedViews = ConcurrentHashMap<View, Date>()
    private val animatedViews = ConcurrentHashMap<View, Date>()
    private val customEvents = ConcurrentHashMap<View, MutableList<Pair<String, Date>>>()

    /**
     * Mark a view as mounted (created/attached)
     */
    fun markMounted(view: View) {
        val now = Date()
        mountedViews[view] = now
        Log.d(LOG_TAG, "View mounted: ${view.javaClass.simpleName} at $now")
    }

    /**
     * Mark a view as updated (props changed)
     */
    fun markUpdated(view: View) {
        val now = Date()
        updatedViews[view] = now
        Log.d(LOG_TAG, "View updated: ${view.javaClass.simpleName} at $now")
    }

    /**
     * Clear animated views older than 5 seconds (called at start of each inquiry)
     */
    fun clearAnimatedViews() {
        val now = System.currentTimeMillis()
        val fiveSecondsAgo = now - 5000

        val iterator = animatedViews.iterator()
        var clearedCount = 0

        while (iterator.hasNext()) {
            val entry = iterator.next()
            if (entry.value.time < fiveSecondsAgo) {
                iterator.remove()
                clearedCount++
            }
        }

        Log.d(LOG_TAG, "Cleared $clearedCount animated views older than 5s, ${animatedViews.size} remaining")
    }

    /**
     * Mark a view as currently animating
     */
    fun markAnimated(view: View) {
        val now = Date()
        animatedViews[view] = now
        Log.d(LOG_TAG, "View animating: ${view.javaClass.simpleName} at $now")
    }

    /**
     * Mark a custom event on a view (e.g., specific animated properties)
     */
    fun markCustomEvent(view: View, event: String) {
        val now = Date()
        customEvents.computeIfAbsent(view) { mutableListOf() }.add(event to now)
        Log.d(LOG_TAG, "Custom event '$event' on view: ${view.javaClass.simpleName} at $now")
    }

    /**
     * Get animation metadata for a view
     */
    fun getAnimationMetadata(view: View): AnimationMetadata? {
        val mounted = mountedViews[view]
        val updated = updatedViews[view]
        val animated = animatedViews[view]
        val events = customEvents[view] ?: emptyList()

        if (mounted == null && updated == null && animated == null && events.isEmpty()) {
            return null
        }

        return AnimationMetadata(
            mounted = mounted,
            updated = updated,
            animated = animated,
            events = events
        )
    }

    /**
     * Clear all data (useful for testing)
     */
    fun clear() {
        mountedViews.clear()
        updatedViews.clear()
        animatedViews.clear()
        customEvents.clear()
        Log.d(LOG_TAG, "ViewLifecycleRegistry cleared")
    }

    /**
     * Get all currently animated views
     */
    fun getAnimatedViews(): Map<View, Date> = animatedViews.toMap()

    /**
     * Check if a view is currently animating
     */
    fun isAnimating(view: View): Boolean = animatedViews.containsKey(view)
}

/**
 * Data class to hold animation metadata for a view
 */
data class AnimationMetadata(
    val mounted: Date?,
    val updated: Date?,
    val animated: Date?,
    val events: List<Pair<String, Date>>
) {
    /**
     * Calculate time since animation started in milliseconds
     */
    fun getAnimationDurationMs(): Long? {
        return animated?.let { System.currentTimeMillis() - it.time }
    }

    /**
     * Calculate time since last update in milliseconds
     */
    fun getUpdateDurationMs(): Long? {
        return updated?.let { System.currentTimeMillis() - it.time }
    }
}
