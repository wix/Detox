package com.wix.detox.espresso.action

import android.view.MotionEvent
import androidx.test.espresso.UiController
import androidx.test.espresso.action.Tapper
import com.nhaarman.mockitokotlin2.*
import com.wix.detox.espresso.DetoxErrors.DetoxRuntimeException
import com.wix.detox.espresso.common.MotionEvents
import org.assertj.core.api.Assertions.assertThat
import org.mockito.Mockito
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe
import kotlin.test.assertFailsWith

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

        fun mockEventInjectionToSucceed()
                = whenever(uiController.injectMotionEventSequence(any())).doReturn(true)

        fun mockEventInjectionToFail()
                = whenever(uiController.injectMotionEventSequence(any())).doReturn(false)

        fun mockEventInjectionToThrow()
                = whenever(uiController.injectMotionEventSequence(any())).doThrow(RuntimeException("exceptionMock"))

        fun mockEventInjectionToWait(time: Long) {
            Mockito.doAnswer {
                Thread.sleep(time + 1)
                true
            }.whenever(uiController).injectMotionEventSequence(any())
        }

        fun verifyMotionEventsInjected(vararg events: MotionEvent)
                = verify(uiController).injectMotionEventSequence(events.asList())

        fun verifyDownEventObtained(coordinates: FloatArray, precision: FloatArray)
                = verify(motionEvents).obtainDownEvent(coordinates[0], coordinates[1], precision)

        fun verifyUpEventObtained(coordinates: FloatArray)
                = verify(motionEvents).obtainUpEvent(eq(downEvent), any(), eq(coordinates[0]), eq(coordinates[1]))

        fun verifyUpEventObtainedWithTimestamp(expectedUpTime: Long)
                = verify(motionEvents).obtainUpEvent(eq(downEvent), eq(expectedUpTime), any(), any())

        fun verifyMainThreadSynced(expectedSyncTime: Long)
                = verify(uiController).loopMainThreadForAtLeast(eq(expectedSyncTime))

        fun verifyMainThreadNeverSynced()
                = verify(uiController, never()).loopMainThreadForAtLeast(any())

        fun uut() = DetoxSingleTap(motionEvents, maxTapTime = 1000L)
        fun uutWithMaxTapTime(maxTapTime: Long) = DetoxSingleTap(motionEvents, maxTapTime = maxTapTime)
        fun uutWithCooldownTime(cooldownTime: Long) = DetoxSingleTap(motionEvents, cooldownTime, 1000L)

        it("should send an down-up events sequence") {
            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            uut().sendTap(uiController, coordinates, precision, 0, 0)

            verifyMotionEventsInjected(downEvent, upEvent)
        }

        it("should create down event with proper coordinates and precision") {
            val coordinates = fancyCoordinates()
            val precision = fancyPrecision()

            uut().sendTap(uiController, coordinates, precision, 0, 0)

            verifyDownEventObtained(coordinates, precision)
        }

        it("should create up event with proper coordinates") {
            val coordinates = fancyCoordinates()
            val precision = fancyPrecision()

            uut().sendTap(uiController, coordinates, precision, 0, 0)

            verifyUpEventObtained(coordinates)
        }

        it("should create up event with a reasonable time-gap (30ms)") {
            val expectedUpEventTime = DEFAULT_EVENT_TIME + 30
            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            uut().sendTap(uiController, coordinates, precision, 0, 0)

            verifyUpEventObtainedWithTimestamp(expectedUpEventTime)
        }

        it("should recycle down+up events") {
            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            uut().sendTap(uiController, coordinates, precision, 0, 0)

            verify(downEvent).recycle()
            verify(upEvent).recycle()
        }

        it("should recycle down_up events even if ui-controller throws") {
            mockEventInjectionToThrow()

            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            assertFailsWith<Exception> {
                uut().sendTap(uiController, coordinates, precision, 0, 0)
            }

            verify(downEvent).recycle()
            verify(upEvent).recycle()
        }

        it("should return failure if ui-controller fails") {
            mockEventInjectionToFail()

            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            val result = uut().sendTap(uiController, coordinates, precision, 0, 0)
            assertThat(result).isEqualTo(Tapper.Status.FAILURE)
        }

        it("should throw if event injection takes too long") {
            val maxTapTime = 10L
            mockEventInjectionToWait(maxTapTime)

            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            assertFailsWith<DetoxRuntimeException> {
                uutWithMaxTapTime(maxTapTime).sendTap(uiController, coordinates, precision, 0, 0)
            }.also {
                assertThat(it.message).contains("Single-tap has taken too long to complete and was registered as a long-tap, instead!")
            }
        }

        it("should return success") {
            mockEventInjectionToSucceed()

            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            val result = uut().sendTap(uiController, coordinates, precision, 0, 0)
            assertThat(result).isEqualTo(Tapper.Status.SUCCESS)
        }

        it("should manage without inputDevice and buttonState args") {
            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            uut().sendTap(uiController, coordinates, precision)

            verifyMotionEventsInjected(downEvent, upEvent)
        }

        it("should idle-wait the cooldown period following a successful tap injection") {
            mockEventInjectionToSucceed()

            val expectedWait = 111L

            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            uutWithCooldownTime(expectedWait).sendTap(uiController, coordinates, precision, 0, 0)

            verifyMainThreadSynced(expectedWait)
        }

        it("should not idle-wait the tap-registration period if tap injection fails") {
            mockEventInjectionToFail()

            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            uutWithCooldownTime(111L).sendTap(uiController, coordinates, precision, 0, 0)

            verifyMainThreadNeverSynced()
        }

        it("should not idle-wait the tap-registration period if provided time is 0") {
            mockEventInjectionToSucceed()

            val coordinates = dontCareCoordinates()
            val precision = dontCarePrecision()

            uutWithCooldownTime(0).sendTap(uiController, coordinates, precision, 0, 0)

            verifyMainThreadNeverSynced()
        }

        it("should throw if no UI-controller provided") {
            assertFailsWith(KotlinNullPointerException::class) {
                uut().sendTap(null, dontCareCoordinates(), dontCarePrecision(), 0, 0)
            }
        }

        it("should throw if no coordinates / precision are provided") {
            assertFailsWith(KotlinNullPointerException::class) {
                uut().sendTap(uiController, null, dontCarePrecision(), 0, 0)
            }

            assertFailsWith(KotlinNullPointerException::class) {
                uut().sendTap(uiController, dontCareCoordinates(), null, 0, 0)
            }
        }
    }
})
