package com.wix.detox.espresso.scroll

import androidx.test.espresso.UiController
import com.wix.detox.espresso.action.common.MotionEvents

/**
 * The delay between each motion event.
 * Reducing this value may fail the swipe on different devices. Please change with caution.
 */
private const val EVENT_DELAY = 25L

/**
 * Implementation of @see DetoxSwiper that swipes in a linear fashion uses const delay between events.
 */
class LinearSwiper @JvmOverloads constructor(
    uiController: UiController,
    motionEvents: MotionEvents = MotionEvents()
) : DetoxSwiper(uiController, motionEvents) {

    override fun calcEventTime(targetX: Float, targetY: Float): Long {
        val lastEvent = events.last()

        return lastEvent.eventTime + EVENT_DELAY
    }

}
