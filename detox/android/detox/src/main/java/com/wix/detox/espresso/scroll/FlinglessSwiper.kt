package com.wix.detox.espresso.scroll

import android.view.MotionEvent
import android.view.ViewConfiguration
import androidx.test.espresso.UiController
import com.wix.detox.espresso.common.MotionEvents

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
        private val uiController: UiController,
        viewConfig: ViewConfiguration,
        private val motionEvents: MotionEvents = MotionEvents())
    : DetoxSwiper {

    private val pixelsPerSecond = viewConfig.scaledMinimumFlingVelocity * VELOCITY_SAFETY_RATIO
    private val fastEventsCountLimit = expectedMotions * FAST_EVENTS_RATIO

    private var downEvent: MotionEvent? = null

    private var events = mutableListOf<MotionEvent>()
    private var motionsCount = 0

    override fun startAt(touchX: Float, touchY: Float) {
        assertNotStarted()

        downEvent = motionEvents.obtainDownEvent(touchX, touchY)
        events.add(downEvent!!)
    }

    override fun moveTo(targetX: Float, targetY: Float): Boolean {
        assertStarted()

        val moveEvent = motionEvents.obtainMoveEvent(downEvent!!, calcEventTime(targetX, targetY), targetX, targetY)
        events.add(moveEvent)

        motionsCount++
        return true
    }

    override fun finishAt(releaseX: Float, releaseY: Float) {
        try {
            val upEvent = motionEvents.obtainUpEvent(downEvent!!, calcEventTime(releaseX, releaseY), releaseX, releaseY)
            events.add(upEvent)

            // Flush!
            uiController.injectMotionEventSequence(events)
        } finally {
            events.forEach { event -> event.recycle() }
            downEvent = null
            motionsCount = 0
        }
    }

    private fun calcEventTime(targetX: Float, targetY: Float): Long {
        val lastEvent = events.last()
        var dt = 10

        if (motionsCount >= fastEventsCountLimit) {
            val dx = Math.abs((targetX - lastEvent.x))
            val dy = Math.abs((targetY - lastEvent.y))

            val dtX = ((dx / pixelsPerSecond) * 1000).toInt()
            val dtY = ((dy / pixelsPerSecond) * 1000).toInt()

            dt = Math.max(dtX, dtY)
        }

        return lastEvent.eventTime + Math.max(dt, 10)
    }

    private fun assertStarted() {
        if (downEvent == null) {
            throw IllegalStateException("Cannot move swiper because it hasn't been started yet - did you forget to call startAt()?")
        }
    }

    private fun assertNotStarted() {
        if (downEvent != null) {
            throw IllegalStateException("Swiper already started")
        }
    }

    companion object {
//        private const val LOG_TAG = "DetoxBatchedSwiper"
        private const val VELOCITY_SAFETY_RATIO = .85f
        private const val FAST_EVENTS_RATIO = .75f
    }
}
