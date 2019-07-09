package com.wix.detox.espresso.scroll

import android.view.MotionEvent
import android.view.ViewConfiguration
import androidx.test.espresso.UiController
import com.wix.detox.espresso.common.MotionEvents

//private const val LOG_TAG = "DetoxBatchedSwiper"

class BatchedSwiper @JvmOverloads constructor(
        private val uiController: UiController,
        private val perMotionTimeMS: Long,
        private val motionEvents: MotionEvents = MotionEvents(),
        private val androidPressedOnDuration: Int = ViewConfiguration.getPressedStateDuration())
    : DetoxSwiper {

    private var downEvent: MotionEvent? = null

    private var events = mutableListOf<MotionEvent>()

    override fun startAt(touchX: Float, touchY: Float) {
        downEvent = motionEvents.obtainDownEvent(touchX, touchY)
        events.add(downEvent!!)
    }

    override fun moveTo(targetX: Float, targetY: Float): Boolean {
        val moveEvent = motionEvents.obtainMoveEvent(downEvent!!, nextEventTime(), targetX, targetY)
        events.add(moveEvent)
        return true
    }

    override fun finishAt(releaseX: Float, releaseY: Float) {
        try {
            val upEvent = motionEvents.obtainUpEvent(downEvent!!, nextEventTime(), releaseX, releaseY)
            events.add(upEvent)

            // Flush!
            uiController.injectMotionEventSequence(events)
        } finally {
            events.forEach { event -> event.recycle() }
            downEvent = null
        }

        syncRelease()
    }

    private fun nextEventTime() = (events.last().eventTime + perMotionTimeMS)

    private fun syncRelease() {
        // Ensures that all child views leave the pressed-on state, if in effect.
        // This is paramount for having consequent tap-events registered properly.
        // Taken from Espresso's GeneralClickAction.perform()
        if (androidPressedOnDuration > 0) {
            uiController.loopMainThreadForAtLeast(androidPressedOnDuration.toLong())
        }
    }
}
