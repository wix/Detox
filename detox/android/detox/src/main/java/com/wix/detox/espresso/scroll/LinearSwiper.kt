package com.wix.detox.espresso.scroll

import android.util.Log
import android.view.MotionEvent
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
class LinearSwiper @JvmOverloads constructor(
        private val expectedMotions: Int,
        private val uiController: UiController,
        viewConfig: ViewConfiguration,
        private val motionEvents: MotionEvents = MotionEvents())
    : DetoxSwiper {

    private val pixelsPerSecond = viewConfig.scaledMinimumFlingVelocity * VELOCITY_SAFETY_RATIO
    private val fastEventsCountLimit = expectedMotions * FAST_EVENTS_RATIO

    private var downEvent: MotionEvent? = null

    private var events = mutableListOf<MotionEvent>()
    private var motionsCount = 0

    private val duration = 1500L

    override fun startAt(touchX: Float, touchY: Float) {
        assertNotStarted()

        downEvent = motionEvents.obtainDownEvent(touchX, touchY)
        Log.d("FlinglessSwiper", "downEvent: $downEvent")
        events.add(downEvent!!)
    }

    override fun moveTo(targetX: Float, targetY: Float): Boolean {
        assertStarted()

        val moveEvent = motionEvents.obtainMoveEvent(downEvent!!, calcEventTime(duration), targetX, targetY)
        events.add(moveEvent)
        Log.d("FlinglessSwiper", "moveEvent: $moveEvent")
        motionsCount++
        return true
    }

    override fun wait(duration: Int) {
        assertStarted()

        val lastEvent = events.last()
        // Insert a fake move event without actually moving, just to wait for the given duration.
        val waitEvent = motionEvents.obtainMoveEvent(downEvent!!, lastEvent.eventTime + duration, lastEvent.x, lastEvent.y)

        Log.d("FlinglessSwiper", "waitEvent: $waitEvent")
        motionsCount += 2
        events.add(waitEvent)
    }

    override fun finishAt(releaseX: Float, releaseY: Float) {
        assertStarted()

        try {
            val upEvent = motionEvents.obtainUpEvent(downEvent!!, calcEventTime(duration), releaseX, releaseY)
            events.add(upEvent)

            Log.d("FlinglessSwiper", "upEvent: $upEvent")

            // Flush!
            uiController.injectMotionEventSequence(events)
        } finally {
            events.forEach { event -> event.recycle() }
            downEvent = null
            motionsCount = 0
        }
    }

    private fun calcEventTime(duration: Long): Long {
        val lastEvent = events.last()

        return lastEvent.eventTime + duration / expectedMotions
    }

    private fun assertStarted() {
        if (downEvent == null) {
            throw IllegalStateException("Swiper not initialized - did you forget to call startAt()?")
        }
    }

    private fun assertNotStarted() {
        if (downEvent != null) {
            throw IllegalStateException("Swiper already started")
        }
    }

    companion object {
//        private const val LOG_TAG = "DetoxBatchedSwiper"
        private const val VELOCITY_SAFETY_RATIO = .99f
        private const val FAST_EVENTS_RATIO = .75f
    }
}
