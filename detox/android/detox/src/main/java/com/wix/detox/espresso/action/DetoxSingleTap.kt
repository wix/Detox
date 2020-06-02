package com.wix.detox.espresso.action

import androidx.test.espresso.UiController
import androidx.test.espresso.action.Tapper
import com.wix.detox.espresso.common.DetoxViewConfigurations.getPostTapCooldownTime
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
        private val cooldownTime: Long = getPostTapCooldownTime())
    : Tapper {

    override fun sendTap(uiController: UiController?, coordinates: FloatArray?, precision: FloatArray?): Tapper.Status
        = sendTap(uiController, coordinates, precision, 0, 0)

    override fun sendTap(uiController: UiController?, coordinates: FloatArray?, precision: FloatArray?, inputDevice: Int, buttonState: Int): Tapper.Status {
        uiController!!
        coordinates!!
        precision!!

        val x = coordinates[0]
        val y = coordinates[1]
        val downEvent = motionEvents.obtainDownEvent(x, y, precision)
        val upEvent = motionEvents.obtainUpEvent(downEvent, downEvent.eventTime + EVENTS_TIME_GAP_MS, x, y)
        try {
            val result = uiController.injectMotionEventSequence(arrayListOf(downEvent, upEvent))
            if (result) {
                if (cooldownTime > 0) {
                    uiController.loopMainThreadForAtLeast(cooldownTime)
                }
                return Tapper.Status.SUCCESS
            }
            return Tapper.Status.FAILURE
        } finally {
            downEvent.recycle()
            upEvent.recycle()
        }
    }

    companion object {
        /**
         * ### IMPORTANT NOTE ON THIS:
         *
         * Given the implementation of [UiControllerImpl.injectMotionEventSequence](androidx.test.espresso.base.UiControllerImpl.injectMotionEventSequence) - which
         * eventually handles the events injection, ideally we would just use 10ms. Actually, in the original implementation, that's what we did.
         *
         * However, recently, annoying RN related bugs we can't control suddenly came to be ([this one](https://github.com/software-mansion/react-native-reanimated/issues/596)
         * in particular), and so in order to comply, we need to try to meet it half-way and use a time gap that's more likely to be applied by a real user,
         * even though for all we know 10ms is enough for any Android native / pure-RN View. The trade-off here, however, being that the more we wait, the
         * higher the chance is for a simple tap to accidentally be registered as a _long_ tap (i.e. on slow devices/emulators).
         * Lastly, With the case of _that_ specific bug, we implicitly indirectly work around it with this approach, because we highly increase
         * the chance of allowing a frame to be drawn in between the _down_ and _up_ events.
         */
        private const val EVENTS_TIME_GAP_MS = 30
    }
}
