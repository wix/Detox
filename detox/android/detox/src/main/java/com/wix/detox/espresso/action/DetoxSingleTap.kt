package com.wix.detox.espresso.action

import android.view.ViewConfiguration
import androidx.test.espresso.UiController
import androidx.test.espresso.action.Tapper
import com.wix.detox.espresso.common.MotionEvents

/**
 * An implementation alternative to Espresso's [androidx.test.espresso.action.Tap.SINGLE].
 *
 * The main different is: Instead of injecting two idle-waiting events (down, then up), we use
 * [UiController.injectMotionEventSequence] in order to inject the two simultaneously, such that no
 * idle-wait is employed in between.
 *
 * The main goal here is to fix a problem where the gap between the 'down' and 'up' becomes too long
 * to the point where the tap gets registered as a long tap (true story).
 *
 * This should be Espresso's default implementation IMO.
 */
class DetoxSingleTap(
        private val motionEvents: MotionEvents = MotionEvents(),
        private val tapTimeout: Long = (ViewConfiguration.getTapTimeout() * 1.5).toLong())
    : Tapper {

    override fun sendTap(uiController: UiController?, coordinates: FloatArray?, precision: FloatArray?): Tapper.Status
        = sendTap(uiController, coordinates, precision, 0, 0)

    override fun sendTap(uiController: UiController?, coordinates: FloatArray?, precision: FloatArray?, inputDevice: Int, buttonState: Int): Tapper.Status {
        coordinates!!
        precision!!

        val x = coordinates[0]
        val y = coordinates[1]
        val downEvent = motionEvents.obtainDownEvent(x, y, precision)
        val upEvent = motionEvents.obtainUpEvent(downEvent, downEvent.eventTime + EVENTS_TIME_GAP_MS, x, y)
        try {
            val result = uiController!!.injectMotionEventSequence(arrayListOf(downEvent, upEvent))
            if (result) {
                uiController.loopMainThreadForAtLeast(tapTimeout)
                return Tapper.Status.SUCCESS
            }
            return Tapper.Status.FAILURE
        } finally {
            downEvent.recycle()
            upEvent.recycle()
        }
    }

    companion object {
        private const val EVENTS_TIME_GAP_MS = 10
    }
}
