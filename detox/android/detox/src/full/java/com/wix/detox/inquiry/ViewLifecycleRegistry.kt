package com.wix.detox.inquiry

import android.view.View
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong

/**
 * Registry to track various lifecycle events of Android Views.
 * Uses WeakHashMap to prevent memory leaks and allows tracking of:
 * - Mount events (when views are created/mounted)
 * - Animation events (when views are animated)
 * - Update events (when views are updated)
 * - Custom events (extensible for future needs)
 */
object ViewLifecycleRegistry {
    private val viewLifecycleInfo = ConcurrentHashMap<View, ViewLifecycleInfo>()
    private val lastCleanupTime = AtomicLong(0)
    private val cleanupIntervalMs = 30_000L // Clean up every 30 seconds

    /**
     * Data class to hold lifecycle information for a view
     */
    data class ViewLifecycleInfo(
        val view: View,
        val mountTime: Long = 0,
        val lastAnimateTime: Long = 0,
        val lastUpdateTime: Long = 0,
        val animationCount: Int = 0,
        val updateCount: Int = 0,
        val customEvents: MutableMap<String, Long> = mutableMapOf()
    ) {
        fun wasRecentlyAnimated(windowMs: Long = 1500): Boolean {
            if (lastAnimateTime == 0L) return false
            return System.currentTimeMillis() - lastAnimateTime <= windowMs
        }

        fun wasRecentlyUpdated(windowMs: Long = 1000): Boolean {
            if (lastUpdateTime == 0L) return false
            return System.currentTimeMillis() - lastUpdateTime <= windowMs
        }

        fun wasRecentlyMounted(windowMs: Long = 5000): Boolean {
            if (mountTime == 0L) return false
            return System.currentTimeMillis() - mountTime <= windowMs
        }

        fun hasCustomEvent(eventType: String, windowMs: Long = 2000): Boolean {
            val eventTime = customEvents[eventType] ?: return false
            return System.currentTimeMillis() - eventTime <= windowMs
        }
    }

    /**
     * Mark a view as mounted
     */
    fun markMounted(view: View) {
        val now = System.currentTimeMillis()
        viewLifecycleInfo.compute(view) { _, existing ->
            existing?.copy(mountTime = now) ?: ViewLifecycleInfo(view, mountTime = now)
        }
        performPeriodicCleanup()
    }

    /**
     * Mark a view as animated
     */
    fun markAnimated(view: View) {
        val now = System.currentTimeMillis()
        
        viewLifecycleInfo.compute(view) { _, existing ->
            val info = existing ?: ViewLifecycleInfo(view)
            info.copy(
                lastAnimateTime = now,
                animationCount = info.animationCount + 1
            )
        }
        performPeriodicCleanup()
    }

    /**
     * Mark a view as updated
     */
    fun markUpdated(view: View) {
        val now = System.currentTimeMillis()
        viewLifecycleInfo.compute(view) { _, existing ->
            val info = existing ?: ViewLifecycleInfo(view)
            info.copy(
                lastUpdateTime = now,
                updateCount = info.updateCount + 1
            )
        }
        performPeriodicCleanup()
    }

    /**
     * Mark a custom event for a view
     */
    fun markCustomEvent(view: View, eventType: String) {
        val now = System.currentTimeMillis()
        viewLifecycleInfo.compute(view) { _, existing ->
            val info = existing ?: ViewLifecycleInfo(view)
            info.customEvents[eventType] = now
            info
        }
        performPeriodicCleanup()
    }

    /**
     * Check if a view was recently animated
     */
    fun wasRecentlyAnimated(view: View, windowMs: Long = 1500): Boolean {
        return viewLifecycleInfo[view]?.wasRecentlyAnimated(windowMs) ?: false
    }

    /**
     * Check if a view was recently updated
     */
    fun wasRecentlyUpdated(view: View, windowMs: Long = 1000): Boolean {
        return viewLifecycleInfo[view]?.wasRecentlyUpdated(windowMs) ?: false
    }

    /**
     * Check if a view was recently mounted
     */
    fun wasRecentlyMounted(view: View, windowMs: Long = 5000): Boolean {
        return viewLifecycleInfo[view]?.wasRecentlyMounted(windowMs) ?: false
    }

    /**
     * Check if a view has a custom event within the time window
     */
    fun hasCustomEvent(view: View, eventType: String, windowMs: Long = 2000): Boolean {
        return viewLifecycleInfo[view]?.hasCustomEvent(eventType, windowMs) ?: false
    }

    /**
     * Get lifecycle info for a view
     */
    fun getLifecycleInfo(view: View): ViewLifecycleInfo? {
        return viewLifecycleInfo[view]
    }

    /**
     * Get all views that were recently animated
     */
    fun getRecentlyAnimatedViews(windowMs: Long = 1500): List<View> {
        return viewLifecycleInfo.keys.filter { wasRecentlyAnimated(it, windowMs) }
    }

    /**
     * Get all views that were recently updated
     */
    fun getRecentlyUpdatedViews(windowMs: Long = 1000): List<View> {
        return viewLifecycleInfo.keys.filter { wasRecentlyUpdated(it, windowMs) }
    }

    /**
     * Get all views that were recently mounted
     */
    fun getRecentlyMountedViews(windowMs: Long = 5000): List<View> {
        return viewLifecycleInfo.keys.filter { wasRecentlyMounted(it, windowMs) }
    }

    /**
     * Get all views with a specific custom event
     */
    fun getViewsWithCustomEvent(eventType: String, windowMs: Long = 2000): List<View> {
        return viewLifecycleInfo.keys.filter { hasCustomEvent(it, eventType, windowMs) }
    }

    /**
     * Get statistics about the registry
     */
    fun getStats(): Map<String, Any> {
        val totalViews = viewLifecycleInfo.size
        val recentlyAnimated = getRecentlyAnimatedViews().size
        val recentlyUpdated = getRecentlyUpdatedViews().size
        val recentlyMounted = getRecentlyMountedViews().size

        return mapOf(
            "totalViews" to totalViews,
            "recentlyAnimated" to recentlyAnimated,
            "recentlyUpdated" to recentlyUpdated,
            "recentlyMounted" to recentlyMounted
        )
    }

    /**
     * Clear all data (useful for testing)
     */
    fun clear() {
        viewLifecycleInfo.clear()
    }

    /**
     * Perform periodic cleanup to remove stale entries
     */
    private fun performPeriodicCleanup() {
        val now = System.currentTimeMillis()
        val lastCleanup = lastCleanupTime.get()

        if (now - lastCleanup > cleanupIntervalMs &&
            lastCleanupTime.compareAndSet(lastCleanup, now)) {

            // Remove views that are no longer valid or haven't been accessed recently
            val iterator = viewLifecycleInfo.iterator()
            while (iterator.hasNext()) {
                val entry = iterator.next()
                val view = entry.key
                val info = entry.value

                // Remove if view is no longer valid or hasn't been accessed in 5 minutes
                if (!isViewValid(view) || (now - info.lastAnimateTime > 300_000 &&
                                          now - info.lastUpdateTime > 300_000 &&
                                          now - info.mountTime > 300_000)) {
                    iterator.remove()
                }
            }
        }
    }

    /**
     * Check if a view is still valid (not garbage collected)
     */
    private fun isViewValid(view: View): Boolean {
        return try {
            view.javaClass // Try to access the view
            true
        } catch (e: Exception) {
            false
        }
    }
}
