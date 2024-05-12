package com.wix.detox.espresso.action.common

import android.view.MotionEvent

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
private const val EVENTS_TIME_GAP_MS = 30L

class TapEvents(private val motionEvents: MotionEvents = MotionEvents()) {
    fun createEventsSeq(coordinates: FloatArray, precision: FloatArray)
            = createEventsSeq(coordinates, precision, null, null)

    fun createEventsSeq(
        coordinates: FloatArray,
        precision: FloatArray,
        downTimestamp: Long?,
        duration: Long?
    ): List<MotionEvent> {
        val (x, y) = coordinates
        val downEvent = motionEvents.obtainDownEvent(x, y, precision, downTimestamp)

        val upEventDuration = duration ?: EVENTS_TIME_GAP_MS
        val upEvent = motionEvents.obtainUpEvent(downEvent, downEvent.eventTime + upEventDuration, x, y)

        return arrayListOf(downEvent, upEvent)
    }
}
