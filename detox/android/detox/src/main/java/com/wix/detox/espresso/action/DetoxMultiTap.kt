package com.wix.detox.espresso.action

import android.view.MotionEvent
import androidx.test.espresso.UiController
import androidx.test.espresso.action.Tapper
import com.wix.detox.common.DetoxLog
import com.wix.detox.common.DetoxLog.Companion.LOG_TAG
import com.wix.detox.common.collect.PairsIterator
import com.wix.detox.common.proxy.CallInfo
import com.wix.detox.espresso.UiControllerSpy
import com.wix.detox.espresso.action.common.DetoxViewConfigurations.getDoubleTapMinTime
import com.wix.detox.espresso.action.common.DetoxViewConfigurations.getLongTapMinTime
import com.wix.detox.espresso.action.common.DetoxViewConfigurations.getPostTapCoolDownTime
import com.wix.detox.espresso.action.common.TapEvents

/**
 * An implementation that is an alternative to Espresso's implementations, namely
 * [androidx.test.espresso.action.Tap.SINGLE] and [androidx.test.espresso.action.Tap.DOUBLE].
 *
 * The main difference is: Instead of injecting distinct idle-waiting events (down, then up, etc.), here,
 * [UiController.injectMotionEventSequence] is used in order to inject all events in one go, such that no
 * idle-wait is employed in between.
 *
 * The main goal here is to fix timing problems where, for example - in a single tap, the gap between
 * the tap's 'down' and 'up' actions becomes too long to the point where the tap gets registered as a
 * long tap (true story!). As for double-taps, a different problem addressed here is where the wait in
 * between taps becomes too long, such that eventually the system registers two distinct taps instead
 * of a single double-tap gesture.
 *
 * This should be Espresso's default implementation IMO.
 */
open class DetoxMultiTap
    @JvmOverloads constructor(
            private val times: Int,
            private val interTapsDelayMs: Long = getDoubleTapMinTime(),
            private val coolDownTimeMs: Long = getPostTapCoolDownTime(),
            private val longTapMinTimeMs: Long = getLongTapMinTime(),
            private val tapEvents: TapEvents = TapEvents(),
            private val uiControllerCallSpy: UiControllerSpy = UiControllerSpy.instance,
            private val log: DetoxLog = DetoxLog.instance)
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

            if (!injectEvents(uiController, eventSequence)) {
                return Tapper.Status.FAILURE
            }
            verifyInjectionPeriods()

            uiController.loopMainThreadForAtLeast(coolDownTimeMs)
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

    private fun injectEvents(uiController: UiController, eventSequence: List<MotionEvent>): Boolean {
        try {
            uiControllerCallSpy.start()
            if (!uiController.injectMotionEventSequence(eventSequence)) {
                return false
            }
        } finally {
            uiControllerCallSpy.stop()
        }
        return true
    }

    /**
     * Note: This renders the class non-extensible so as to not being able to handle other types of taps -- for example, a
     * long-tap created by tapEvents.
     * If extensibility is ever needed, this can, be solved by refactoring tapEvents onto a tap injection class
     * that both creates tap events and validates the right constraints over them.
     */
    private fun verifyInjectionPeriods() {
        val rawIterator = uiControllerCallSpy.eventInjectionsIterator()
        PairsIterator(rawIterator).forEach {
            verifyTapEventTimes(it.first!!, it.second!!)
        }
    }

    private fun verifyTapEventTimes(upEvent: CallInfo, downEvent: CallInfo) {
        val delta: Long = (upEvent - downEvent)!!
        if (delta >= longTapMinTimeMs) {
            log.warn(LOG_TAG, "Tap handled too slowly, and turned into a long-tap!") // TODO conditionally turn into an error, based on a global strict-mode detox config
        }
    }
}