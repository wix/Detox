package com.wix.detox.common

import android.view.MotionEvent
import com.wix.detox.espresso.action.common.MotionEvents
import com.wix.detox.espresso.action.common.TapEvents
import org.assertj.core.api.Assertions.assertThat
import org.mockito.kotlin.*
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe

private fun dontCareCoordinates() = FloatArray(2) { 0f }
private fun dontCarePrecision() = FloatArray(2) { 0f }
private fun fancyCoordinates() = FloatArray(2) { index -> ((index + 1) * 100).toFloat() }
private fun fancyPrecision() = FloatArray(2) { index -> ((index + 1) * 1000).toFloat() }

private const val DEFAULT_EVENT_TIME = 1000L

object TapEventsSpec: Spek({
    describe("Tap-Events wrapper") {
        lateinit var downEvent: MotionEvent
        lateinit var upEvent: MotionEvent
        lateinit var motionEvents: MotionEvents

        beforeEachTest {
            downEvent = mock(name = "downEventMock") {
                on { eventTime }.doReturn(DEFAULT_EVENT_TIME)
            }
            upEvent = mock(name = "upEventMock")
            motionEvents = mock {
                on { obtainDownEvent(any(), any(), any()) }.doReturn(downEvent)
                on { obtainDownEvent(any(), any(), any(), any()) }.doReturn(downEvent)
                on { obtainDownEvent(any(), any(), any(), isNull()) }.doReturn(downEvent)
                on { obtainUpEvent(eq(downEvent), any(), any(), any()) }.doReturn(upEvent)
            }
        }

        fun uut() = TapEvents(motionEvents)

        fun verifyDownEventObtained(coordinates: FloatArray, precision: FloatArray)
                = verify(motionEvents).obtainDownEvent(coordinates[0], coordinates[1], precision, null)

        fun verifyDownEventObtainedWithDownTimestamp(coordinates: FloatArray, precision: FloatArray, downTimestamp: Long?)
                = verify(motionEvents).obtainDownEvent(coordinates[0], coordinates[1], precision, downTimestamp)

        fun verifyUpEventObtained(coordinates: FloatArray)
                = verify(motionEvents).obtainUpEvent(eq(downEvent), any(), eq(coordinates[0]), eq(coordinates[1]))

        fun verifyUpEventObtainedWithTimestamp(expectedUpTime: Long)
                = verify(motionEvents).obtainUpEvent(eq(downEvent), eq(expectedUpTime), any(), any())

        it("should obtain a down-event") {
            val coordinates = fancyCoordinates()
            val precision = fancyPrecision()

            uut().createEventsSeq(coordinates, precision)

            verifyDownEventObtained(coordinates, precision)
        }

        it("should obtain an up-event") {
            val coordinates = fancyCoordinates()
            val precision = fancyPrecision()

            uut().createEventsSeq(coordinates, precision)

            verifyUpEventObtained(coordinates)
        }

        it("should obtain up event with a reasonable time-gap (30ms)") {
            val expectedUpEventTime = DEFAULT_EVENT_TIME + 30
            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            uut().createEventsSeq(coordinates, precision)

            verifyUpEventObtainedWithTimestamp(expectedUpEventTime)
        }

        it("should return a down-up events sequence") {
            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            val eventSeq = uut().createEventsSeq(coordinates, precision)

            assertThat(eventSeq).isEqualTo(arrayListOf(downEvent, upEvent))
        }

        it("should allow for an explicit down-time parameter") {
            val coordinates = fancyCoordinates()
            val precision = fancyPrecision()
            val downTimestamp = 10203040L

            uut().createEventsSeq(coordinates, precision, downTimestamp, null)

            verifyDownEventObtainedWithDownTimestamp(coordinates, precision, downTimestamp)
        }

        it("should allow for duration to be set") {
            val duration = 1000L
            val expectedUpEventTime = DEFAULT_EVENT_TIME + duration
            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            uut().createEventsSeq(coordinates, precision, null, duration)

            verifyDownEventObtainedWithDownTimestamp(coordinates, precision, null)
            verifyUpEventObtainedWithTimestamp(expectedUpEventTime)
        }

        it("should allow for down-time and duration to be null") {
            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            uut().createEventsSeq(coordinates, precision, null, null)

            verifyDownEventObtainedWithDownTimestamp(coordinates, precision, null)
        }
    }
})
