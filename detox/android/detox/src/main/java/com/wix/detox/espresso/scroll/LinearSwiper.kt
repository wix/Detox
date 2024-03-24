package com.wix.detox.espresso.scroll

import android.view.MotionEvent
import android.view.ViewConfiguration
import androidx.test.espresso.UiController
import com.wix.detox.espresso.action.common.MotionEvents

/**
 *
 * @see DetoxSwipe
 */
class LinearSwiper @JvmOverloads constructor(
        private val uiController: UiController,
        private val motionEvents: MotionEvents = MotionEvents())
    : DetoxSwiper {

    private var downEvent: MotionEvent? = null

    private var events = mutableListOf<MotionEvent>()

    /**
     * The delay between each motion event.
     */
    private val eventDuration = 30L

    override fun startAt(touchX: Float, touchY: Float) {
        assertNotStarted()

        downEvent = motionEvents.obtainDownEvent(touchX, touchY)
        events.add(downEvent!!)
    }

    override fun moveTo(targetX: Float, targetY: Float): Boolean {
        assertStarted()

        val moveEvent = motionEvents.obtainMoveEvent(downEvent!!, calcEventTime(), targetX, targetY)
        events.add(moveEvent)
        return true
    }

    override fun wait(duration: Int) {
        assertStarted()

        val lastEvent = events.last()
        // Insert a fake move event without actually moving, just to wait for the given duration.
        val waitEvent = motionEvents.obtainMoveEvent(downEvent!!, lastEvent.eventTime + duration, lastEvent.x, lastEvent.y)

        events.add(waitEvent)
    }

    override fun finishAt(releaseX: Float, releaseY: Float) {
        assertStarted()

        try {
            val upEvent = motionEvents.obtainUpEvent(downEvent!!, calcEventTime(), releaseX, releaseY)
            events.add(upEvent)

            // Flush!
            uiController.injectMotionEventSequence(events)
        } finally {
            events.forEach { event -> event.recycle() }
            downEvent = null
        }
    }

    private fun calcEventTime(): Long {
        val lastEvent = events.last()

        return lastEvent.eventTime + eventDuration
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
}
