package com.wix.detox.espresso.action

import android.view.MotionEvent
import androidx.test.espresso.UiController
import androidx.test.espresso.action.Tapper
import com.wix.detox.espresso.base.EventInjectionStrategyProxy
import com.wix.detox.espresso.common.DetoxViewConfigurations.getDoubleTapMinTime
import com.wix.detox.espresso.common.DetoxViewConfigurations.getPostTapCooldownTime
import com.wix.detox.espresso.common.MotionEvents
import org.apache.commons.lang3.reflect.FieldUtils

class CheatingIterator(private val eventSequences: List<List<MotionEvent>>) : Iterator<MotionEvent> {
    private var seqIndex = 0
    private var seqIter = eventSequences[0].iterator()

    override fun hasNext(): Boolean {
        if (seqIndex == eventSequences.size) {
            return false
        }

        if (seqIter.hasNext()) {
            return true
        }

        seqIndex++
        seqIter = if (seqIndex < eventSequences.size) eventSequences[seqIndex].iterator() else emptyList<MotionEvent>().iterator()
        return false
    }

    override fun next(): MotionEvent {
        return seqIter.next()
    }
}

class DetoxMultiTap2
    @JvmOverloads constructor(
        private val times: Int,
        private val interTapsDelayMs: Long = getDoubleTapMinTime(),
        private val coolDownTime: Long = getPostTapCooldownTime(),
        private val motionEvents: MotionEvents = MotionEvents())
    : Tapper {

    override fun sendTap(uiController: UiController?, coordinates: FloatArray?, precision: FloatArray?)
            = sendTap(uiController, coordinates, precision, 0, 0)

    override fun sendTap(uiController: UiController?, coordinates: FloatArray?, precision: FloatArray?, inputDevice: Int, buttonState: Int): Tapper.Status {
        uiController!!
        coordinates!!
        precision!!





        val eventInjectorField = uiController.javaClass.getDeclaredField("eventInjector")
        eventInjectorField.isAccessible = true
        val eventInjector = eventInjectorField.get(uiController)

        var eventInjectionStrategyField = eventInjector.javaClass.getDeclaredField("injectionStrategy")
        FieldUtils.removeFinalModifier(eventInjectionStrategyField, true)
        eventInjectionStrategyField.isAccessible = true
        val eventInjectionStrategy = eventInjectionStrategyField.get(eventInjector)

        val eventInjectionStrategyProxy = EventInjectionStrategyProxy.create(eventInjectionStrategy)
        eventInjectionStrategyField = eventInjector.javaClass.getDeclaredField("injectionStrategy")
        FieldUtils.removeFinalModifier(eventInjectionStrategyField, true)
        eventInjectionStrategyField.isAccessible = true
        eventInjectionStrategyField.set(eventInjector, eventInjectionStrategyProxy)


        val eventSequence = mutableListOf<MotionEvent>()
        try {
            var downTime: Long? = null
            for (i in 1..times) {
                val tapEvents = DetoxSingleTap.createTapEvents(motionEvents, coordinates, precision, downTime)
                eventSequence.addAll(tapEvents)

                downTime = tapEvents.last().eventTime + interTapsDelayMs
            }

            if (!uiController.injectMotionEventSequence(eventSequence)) {
                return Tapper.Status.FAILURE
            }
            uiController.loopMainThreadForAtLeast(coolDownTime)
        } finally {
            eventSequence.forEach { it.recycle() }
        }

        return Tapper.Status.SUCCESS
    }
}
