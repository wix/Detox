package com.wix.detox.espresso.action

import android.view.MotionEvent
import androidx.test.espresso.UiController
import androidx.test.espresso.action.Tapper
import com.nhaarman.mockitokotlin2.*
import com.wix.detox.common.DetoxLog
import com.wix.detox.common.proxy.CallInfo
import com.wix.detox.espresso.UiControllerSpy
import com.wix.detox.espresso.action.common.TapEvents
import org.assertj.core.api.Assertions.assertThat
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe
import kotlin.test.assertFailsWith

object DetoxMultiTapSpec: Spek({
    describe("Detox multi-tapper replacement for Espresso") {

        val coolDownTimeMs = 111L
        val interTapsDelayMs = 667L
        val longTapMinTimeMs = 333L
        val coordinates = FloatArray(2) { 1f }
        val precision = FloatArray(2) { 2f }

        lateinit var uiController: UiController
        lateinit var mock1stTapEventsSeq: List<MotionEvent>
        lateinit var mock2ndTapEventsSeq: List<MotionEvent>
        lateinit var tapEvents: TapEvents
        lateinit var uiControllerCallSpy: UiControllerSpy
        lateinit var log: DetoxLog

        beforeEachTest {
            uiController = mock()

            val downEvent: MotionEvent = mock(name = "mockSeq1Event1")
            val upEvent: MotionEvent = mock(name = "mockSeq1Event2") {
                on { eventTime }.thenReturn(6000)
            }

            mock1stTapEventsSeq = arrayListOf(downEvent, upEvent)
            mock2ndTapEventsSeq = arrayListOf(mock(name = "mockSeq2Event1"), mock(name = "mockSeq2Event2"))
            tapEvents = mock {
                on { createEventsSeq(any(), any(), isNull()) }.doReturn(mock1stTapEventsSeq)
                on { createEventsSeq(any(), any(), any()) }.doReturn(mock2ndTapEventsSeq)
            }

            uiControllerCallSpy = mock() {
                on { eventInjectionsIterator() }.doReturn(emptyList<CallInfo?>().iterator())
            }

            log = mock()
        }

        fun verify1stTapEventsSeqGenerated() = verify(tapEvents).createEventsSeq(coordinates, precision, null)
        fun verify2ndTapEventsSeqGenerated() = verify(tapEvents).createEventsSeq(eq(coordinates), eq(precision), any())
        fun verify2ndTapEventsGenerateWithTimestamp(downTimestamp: Long) = verify(tapEvents).createEventsSeq(any(), any(), eq(downTimestamp))
        fun verifyAllTapEventsInjected() = verify(uiController).injectMotionEventSequence(arrayListOf(mock1stTapEventsSeq, mock2ndTapEventsSeq).flatten())
        fun verifyMainThreadSynced() = verify(uiController).loopMainThreadForAtLeast(eq(coolDownTimeMs))
        fun verifyMainThreadNeverSynced() = verify(uiController, never()).loopMainThreadForAtLeast(any())

        fun givenInjectionSuccess() = whenever(uiController.injectMotionEventSequence(any())).thenReturn(true)
        fun givenInjectionFailure() = whenever(uiController.injectMotionEventSequence(any())).thenReturn(false)
        fun givenInjectionError() = whenever(uiController.injectMotionEventSequence(any())).doThrow(RuntimeException("exceptionMock"))

        fun givenInjectionCallsHistory(injectionsHistory: List<CallInfo?>) =
                whenever(uiControllerCallSpy.eventInjectionsIterator()).thenReturn(injectionsHistory.iterator())

        fun uut(times: Int) = DetoxMultiTap(times, interTapsDelayMs, coolDownTimeMs, longTapMinTimeMs, tapEvents, uiControllerCallSpy, log)
        fun sendOneTap(uut: DetoxMultiTap = uut(1)) = uut.sendTap(uiController, coordinates, precision, -1, -1)
        fun sendTwoTaps(uut: DetoxMultiTap = uut(2)) = uut.sendTap(uiController, coordinates, precision, -1, -1)

        it("should generate a single-tap events sequence using tap-events helper") {
            sendOneTap()
            verify1stTapEventsSeqGenerated()
        }

        it("should generate multiple sets of single-tap event sequences using tap-events helper") {
            sendTwoTaps()
            verify1stTapEventsSeqGenerated()
            verify2ndTapEventsSeqGenerated()
        }

        it("should generate 2nd event sequence with proper down-event timestamp") {
            val expectedDownTimestamp = mock1stTapEventsSeq.last().eventTime + interTapsDelayMs
            sendTwoTaps()
            verify2ndTapEventsGenerateWithTimestamp(expectedDownTimestamp)
        }

        it("should inject the events sequence") {
            sendTwoTaps()
            verifyAllTapEventsInjected()
        }

        it("should recycle tap events") {
            sendTwoTaps()
            verify(mock1stTapEventsSeq.first()).recycle()
            verify(mock2ndTapEventsSeq.last()).recycle()
        }

        it("should recycle events even if ui-controller throws") {
            givenInjectionError()

            assertFailsWith<RuntimeException> {
                sendTwoTaps()
            }
            verify(mock2ndTapEventsSeq.last()).recycle()
        }

        it("should return failure if ui-controller fails") {
            givenInjectionFailure()
            val result = sendOneTap()
            assertThat(result).isEqualTo(Tapper.Status.FAILURE)
        }

        it("should return success") {
            givenInjectionSuccess()
            val result = sendOneTap()
            assertThat(result).isEqualTo(Tapper.Status.SUCCESS)
        }

        it("should manage without inputDevice and buttonState args") {
            uut(2).sendTap(uiController, coordinates, precision)
            verifyAllTapEventsInjected()
        }

        it("should post idle-wait the cool-down period following a successful tap injection") {
            givenInjectionSuccess()
            sendOneTap()
            verifyMainThreadSynced()
        }

        it("should not post idle-wait if tap injection fails") {
            givenInjectionFailure()
            sendOneTap()
            verifyMainThreadNeverSynced()
        }

        it("should throw if no UI-controller provided") {
            assertFailsWith(KotlinNullPointerException::class) {
                uut(1).sendTap(null, coordinates, precision, -1, -1)
            }
        }

        it("should throw if no coordinates / precision are provided") {
            assertFailsWith(KotlinNullPointerException::class) {
                uut(1).sendTap(uiController, null, precision, -1, -1)
            }

            assertFailsWith(KotlinNullPointerException::class) {
                uut(1).sendTap(uiController, coordinates, null, -1, -1)
            }
        }

        it("should start ui-controller spy before injecting events") {
            sendOneTap()

            inOrder(uiControllerCallSpy, uiController) {
                verify(uiControllerCallSpy).start()
                verify(uiController).injectMotionEventSequence(any())
            }
        }

        it("should stop ui-controller spy after injecting events") {
            givenInjectionSuccess()

            sendOneTap()
            inOrder(uiControllerCallSpy, uiController) {
                verify(uiController).injectMotionEventSequence(any())
                verify(uiControllerCallSpy).stop()
            }
        }

        it("should stop ui-controller spy after injecting events even if injection fails") {
            givenInjectionFailure()

            sendOneTap()
            verify(uiControllerCallSpy).stop()
        }

        it("should stop ui-controller spy after injecting events even if injection crashes") {
            givenInjectionError()

            try {
                sendOneTap()
            } catch (e: Exception) {}
            verify(uiControllerCallSpy).stop()
        }

        it("should warn if ui-controller spy indicates tap has turned into a long-tap") {
            givenInjectionSuccess()

            val injectionsHistory = listOf(
                    CallInfo(longTapMinTimeMs - 1, longTapMinTimeMs),
                    CallInfo(0, 1)
            )
            givenInjectionCallsHistory(injectionsHistory)

            sendOneTap()
            verify(log).warn("Detox", "Tap handled too slowly, and turned into a long-tap!")
        }

        it("should warn if ui-controller spy indicates tap 1 of 2 has turned into a long-tap") {
            givenInjectionSuccess()

            val injectionsHistory = listOf(
                    CallInfo(longTapMinTimeMs + 10, longTapMinTimeMs + 11), CallInfo(10, 11),
                    CallInfo(6, 10), CallInfo(0, 5)
            )
            givenInjectionCallsHistory(injectionsHistory)

            sendOneTap()
            verify(log, times(1)).warn("Detox", "Tap handled too slowly, and turned into a long-tap!")
        }
    }
})
