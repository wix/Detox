package com.wix.detox.espresso.scroll

import android.view.MotionEvent
import androidx.test.espresso.UiController
import com.wix.detox.espresso.action.common.MotionEvents

abstract class DetoxSwiper(
    private val uiController: UiController,
    private val motionEvents: MotionEvents
) {

    private var downEvent: MotionEvent? = null

    protected val events = mutableListOf<MotionEvent>()

    fun startAt(touchX: Float, touchY: Float) {
        assertNotStarted()

        downEvent = motionEvents.obtainDownEvent(touchX, touchY)
        events.add(downEvent!!)
    }

    fun moveTo(targetX: Float, targetY: Float): Boolean {
        assertStarted()

        val moveEvent = motionEvents.obtainMoveEvent(downEvent!!, calcEventTime(targetX, targetY), targetX, targetY)
        events.add(moveEvent)
        return true
    }

    fun wait(duration: Int) {
        assertStarted()

        val lastEvent = events.last()
        // Insert a fake move event without actually moving, just to wait for the given duration.
        val waitEvent = motionEvents.obtainMoveEvent(downEvent!!, lastEvent.eventTime + duration, lastEvent.x, lastEvent.y)
        events.add(waitEvent)
    }

    fun finishAt(releaseX: Float, releaseY: Float) {
        assertStarted()

        try {
            val upEvent = motionEvents.obtainUpEvent(downEvent!!, calcEventTime(releaseX, releaseY), releaseX, releaseY)
            events.add(upEvent)

            // Flush!
            uiController.injectMotionEventSequence(events)
        } finally {
            events.forEach { event -> event.recycle() }
            downEvent = null
        }
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

    protected abstract fun calcEventTime(targetX: Float, targetY: Float): Long
}
