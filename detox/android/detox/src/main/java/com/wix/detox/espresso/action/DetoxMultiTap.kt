package com.wix.detox.espresso.action

import android.view.MotionEvent
import androidx.test.espresso.UiController
import androidx.test.espresso.action.Tapper
import com.wix.detox.espresso.common.DetoxViewConfigurations.getDoubleTapMinTime
import com.wix.detox.espresso.common.DetoxViewConfigurations.getPostTapCoolDownTime
import com.wix.detox.espresso.common.TapEvents

/**
 * An implementation that is an alternative to Espresso's implementations, namely
 * [androidx.test.espresso.action.Tap.SINGLE] and [androidx.test.espresso.action.Tap.DOUBLE].
 *
 * The main difference is: Instead of injecting distinct idle-waiting events (down, then up, etc.), we use
 * [UiController.injectMotionEventSequence] in order to inject all events in one go, such that no
 * idle-wait is employed in between.
 *
 * The main goal here is to fix timing problems where, for example - in a single tap, the gap between
 * the tap's 'down' and 'up' actions becomes too long to the point where the tap gets registered as a
 * long tap (true story). As for double-taps, a different problem addressed here is where the wait in
 * between taps becomes too long, such that eventually the system registers two distinct taps instead
 * of a single double-tap gesture.
 *
 * This should be Espresso's default implementation IMO.
 */
open class DetoxMultiTap
    @JvmOverloads constructor(
            private val times: Int,
            private val interTapsDelayMs: Long = getDoubleTapMinTime(),
            private val coolDownTime: Long = getPostTapCoolDownTime(),
            private val tapEvents: TapEvents = TapEvents())
    : Tapper {

    override fun sendTap(uiController: UiController?, coordinates: FloatArray?, precision: FloatArray?)
            = sendTap(uiController, coordinates, precision, 0, 0)

    override fun sendTap(uiController: UiController?, coordinates: FloatArray?, precision: FloatArray?, inputDevice: Int, buttonState: Int): Tapper.Status {
        uiController!!
        coordinates!!
        precision!!

        var eventSequence: List<MotionEvent>? = null
        try {
            eventSequence = generateEventSequences(coordinates, precision)

            if (!uiController.injectMotionEventSequence(eventSequence)) {
                return Tapper.Status.FAILURE
            }
            uiController.loopMainThreadForAtLeast(coolDownTime)
            return Tapper.Status.SUCCESS
        } finally {
            eventSequence?.forEach { it.recycle() }
        }
    }

    private fun generateEventSequences(coordinates: FloatArray, precision: FloatArray): List<MotionEvent> {
        val eventSequence = mutableListOf<MotionEvent>()
        var downTimestamp: Long? = null

        for (i in 1..times) {
            val tapEvents = tapEvents.createEventsSeq(coordinates, precision, downTimestamp)
            eventSequence.addAll(tapEvents)

            downTimestamp = tapEvents.last().eventTime + interTapsDelayMs
        }
        return eventSequence
    }
}
