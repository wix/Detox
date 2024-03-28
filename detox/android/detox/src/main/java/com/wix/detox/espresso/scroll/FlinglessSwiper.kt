package com.wix.detox.espresso.scroll

import android.view.ViewConfiguration
import androidx.test.espresso.UiController
import com.wix.detox.espresso.action.common.MotionEvents

/**
 * A detox-swiper that, given the total expected motions, tries to swipe fast and yet avoid an
 * undesired fling, typically triggered at the end of a swipe motion over scrollable views. It mostly
 * relies on [ViewConfiguration.getScaledMinimumFlingVelocity] (i.e. tries to keep swiping below
 * that velocity, at least at the end).
 *
 * @see DetoxSwipe
 */
class FlinglessSwiper @JvmOverloads constructor(
        expectedMotions: Int,
        uiController: UiController,
        viewConfig: ViewConfiguration,
        motionEvents: MotionEvents = MotionEvents())
    : DetoxSwiper(uiController, motionEvents) {

    private val pixelsPerSecond = viewConfig.scaledMinimumFlingVelocity * VELOCITY_SAFETY_RATIO
    private val fastEventsCountLimit = expectedMotions * FAST_EVENTS_RATIO

    override fun calcEventTime(targetX: Float, targetY: Float): Long {
        val lastEvent = events.last()
        var dt = 10

        val motionsCount = events.size

        if (motionsCount >= fastEventsCountLimit) {
            val dx = Math.abs((targetX - lastEvent.x))
            val dy = Math.abs((targetY - lastEvent.y))

            val dtX = ((dx / pixelsPerSecond) * 1000).toInt()
            val dtY = ((dy / pixelsPerSecond) * 1000).toInt()

            dt = Math.max(dtX, dtY)
        }

        return lastEvent.eventTime + Math.max(dt, 10)
    }


    companion object {
//        private const val LOG_TAG = "DetoxBatchedSwiper"
        private const val VELOCITY_SAFETY_RATIO = .99f
        private const val FAST_EVENTS_RATIO = .75f
    }
}
