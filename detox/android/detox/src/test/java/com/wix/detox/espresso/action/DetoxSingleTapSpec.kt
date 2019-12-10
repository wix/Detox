package com.wix.detox.espresso.action

import android.view.MotionEvent
import androidx.test.espresso.UiController
import androidx.test.espresso.action.Tapper
import com.nhaarman.mockitokotlin2.*
import com.wix.detox.espresso.common.MotionEvents
import org.assertj.core.api.Assertions.assertThat
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe

private fun dontCareCoordinates() = FloatArray(2) { 0f }
private fun dontCarePrecision() = FloatArray(2) { 0f }
private fun fancyCoordinates() = FloatArray(2) { index -> ((index + 1) * 100).toFloat() }
private fun fancyPrecision() = FloatArray(2) { index -> ((index + 1) * 1000).toFloat() }

private const val DEFAULT_EVENT_TIME = 1000L

object DetoxSingleTapSpec: Spek({
    describe("Detox single-tapper replacement for Espresso") {
        lateinit var uiController: UiController
        lateinit var downEvent: MotionEvent
        lateinit var upEvent: MotionEvent
        lateinit var motionEvents: MotionEvents

        beforeEachTest {
            uiController = mock()

            downEvent = mock(name = "downEventMock") {
                on { eventTime }.doReturn(DEFAULT_EVENT_TIME)
            }
            upEvent = mock(name = "upEventMock")
            motionEvents = mock {
                on { obtainDownEvent(any(), any(), any()) }.doReturn(downEvent)
                on { obtainUpEvent(eq(downEvent), any(), any(), any()) }.doReturn(upEvent)
            }
        }

        fun uut() = DetoxSingleTap(motionEvents)
        fun uut(tapTimeout: Long) = DetoxSingleTap(motionEvents, tapTimeout)

        it("should send an down-up events sequence") {
            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            uut().sendTap(uiController, coordinates, precision, 0, 0)

            verify(uiController).injectMotionEventSequence(arrayListOf(downEvent, upEvent))
        }

        it("should create down event with proper coordinates and precision") {
            val coordinates = fancyCoordinates()
            val precision = fancyPrecision()

            uut().sendTap(uiController, coordinates, precision, 0, 0)

            verify(motionEvents).obtainDownEvent(coordinates[0], coordinates[1], precision)
        }

        it("should create up event with proper coordinates") {
            val coordinates = fancyCoordinates()
            val precision = fancyPrecision()

            uut().sendTap(uiController, coordinates, precision, 0, 0)

            verify(motionEvents).obtainUpEvent(eq(downEvent), any(), eq(coordinates[0]), eq(coordinates[1]))
        }

        // See UIControllerImpl.injectMotionEventSequence()
        it("should create up event with max time-gap (10ms) to avoid espresso sleep") {
            val expectedUpEventTime = DEFAULT_EVENT_TIME + 10
            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            uut().sendTap(uiController, coordinates, precision, 0, 0)

            verify(motionEvents).obtainUpEvent(eq(downEvent), eq(expectedUpEventTime), any(), any())
        }

        it("should recycle down+up events") {
            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            uut().sendTap(uiController, coordinates, precision, 0, 0)

            verify(downEvent).recycle()
            verify(upEvent).recycle()
        }

        it("should recycle down_up events even if ui-controller throws") {
            whenever(uiController.injectMotionEventSequence(any())).doThrow(RuntimeException("exceptionMock"))

            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            // TODO retry integrating https://junit.org/junit4/javadoc/4.12/org/junit/rules/ExpectedException.html
            var err: Exception? = null
            try {
                uut().sendTap(uiController, coordinates, precision, 0, 0)
            } catch (e: Exception) {
                err = e
            }

            assertThat(err).isNotNull()
            verify(downEvent).recycle()
            verify(upEvent).recycle()
        }

        it("should return failure if ui-controller fails") {
            whenever(uiController.injectMotionEventSequence(any())).doReturn(false)

            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            val result = uut().sendTap(uiController, coordinates, precision, 0, 0)
            assertThat(result).isEqualTo(Tapper.Status.FAILURE)
        }

        it("should return success") {
            whenever(uiController.injectMotionEventSequence(any())).doReturn(true)

            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            val result = uut().sendTap(uiController, coordinates, precision, 0, 0)
            assertThat(result).isEqualTo(Tapper.Status.SUCCESS)
        }

        it("should manage without inputDevice and buttonState args") {
            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            uut().sendTap(uiController, coordinates, precision)

            verify(uiController).injectMotionEventSequence(arrayListOf(downEvent, upEvent))
        }

        it("should idle-wait the tap-registration period following a successful tap injection") {
            whenever(uiController.injectMotionEventSequence(any())).doReturn(true)

            val expectedWait = 111L

            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            uut(expectedWait).sendTap(uiController, coordinates, precision, 0, 0)

            verify(uiController).loopMainThreadForAtLeast(eq(expectedWait))
        }

        it("should not idle-wait the tap-registration period if tap injection fails") {
            whenever(uiController.injectMotionEventSequence(any())).doReturn(false)

            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            uut(111L).sendTap(uiController, coordinates, precision, 0, 0)

            verify(uiController, never()).loopMainThreadForAtLeast(any())
        }
    }
})
