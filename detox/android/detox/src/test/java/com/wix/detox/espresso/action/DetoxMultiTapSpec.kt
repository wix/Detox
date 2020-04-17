package com.wix.detox.espresso.action

import androidx.test.espresso.UiController
import androidx.test.espresso.action.Tapper
import com.nhaarman.mockitokotlin2.*
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe
import org.assertj.core.api.Assertions.assertThat
import kotlin.test.*

private fun dontCareCoordinates() = FloatArray(2) { 0f }
private fun dontCarePrecision() = FloatArray(2) { 0f }

object DetoxMultiTapSpec: Spek({
    describe("Detox multi-tapper replacement for Espresso") {

        val coordinates = dontCareCoordinates()
        val precision = dontCarePrecision()
        val interTapDelayMs = 667L

        lateinit var delegatedTapper: Tapper
        lateinit var uiController: UiController

        beforeEachTest {
            uiController = mock()
            delegatedTapper = mock()
        }

        fun uut(times: Int) = DetoxMultiTap(times, interTapDelayMs) { delegatedTapper }
        fun uutNoTapWait(times: Int) = DetoxMultiTap(times, null) { delegatedTapper }

        it("should trigger a delegated tapper (typically a single-tap tapper)") {
            uut(1).sendTap(uiController, coordinates, precision, 0, 0)
            verify(delegatedTapper, times(1)).sendTap(uiController, coordinates, precision, 0, 0)
        }

        it("should trigger the delegated tapper multiple times") {
            uut(2).sendTap(uiController, coordinates, precision, 0, 0)
            verify(delegatedTapper, times(2)).sendTap(uiController, coordinates, precision, 0, 0)
        }

        it("should return a successful result") {
            val result = uut(2).sendTap(uiController, coordinates, precision, 0, 0)
            assertThat(result).isEqualTo(Tapper.Status.SUCCESS)
        }

        it("should break early if delegated tapper fails") {
            whenever(delegatedTapper.sendTap(eq(uiController), any(), any(), any(), any())).thenReturn(Tapper.Status.FAILURE)

            val result = uut(2).sendTap(uiController, coordinates, precision, 0, 0)

            verify(delegatedTapper, times(1)).sendTap(uiController, coordinates, precision, 0, 0)
            assertThat(result).isEqualTo(Tapper.Status.FAILURE)
        }

        it("should wait in-between taps") {
            uut(2).sendTap(uiController, coordinates, precision, 0, 0)

            verify(uiController, times(1)).loopMainThreadForAtLeast(interTapDelayMs)
            inOrder(delegatedTapper, uiController) {
                verify(delegatedTapper).sendTap(any(), any(), any(), any(), any())
                verify(uiController).loopMainThreadForAtLeast(any())
                verify(delegatedTapper).sendTap(any(), any(), any(), any(), any())
            }
        }

        it("should not wait in-between taps if time-out was set 'null'") {
            uutNoTapWait(2).sendTap(uiController, coordinates, precision, 0, 0)
            verify(uiController, never()).loopMainThreadForAtLeast(any())
        }

        it("should throw if no UI-controller provided") {
            assertFailsWith(KotlinNullPointerException::class) {
                uut(2).sendTap(null, coordinates, precision, 0, 0)
            }
        }

        it("should throw if no coordinates / precision are provided") {
            assertFailsWith(KotlinNullPointerException::class) {
                uut(2).sendTap(uiController, null, precision, 0, 0)
            }

            assertFailsWith(KotlinNullPointerException::class) {
                uut(2).sendTap(uiController, coordinates, null, 0, 0)
            }
        }

        it("should support the tapper's deprecated sendTap() call") {
            val result = uut(1).sendTap(uiController, coordinates, precision)
            verify(delegatedTapper, times(1)).sendTap(uiController, coordinates, precision, 0, 0)
            assertThat(result).isEqualTo(Tapper.Status.SUCCESS)
        }
    }
})