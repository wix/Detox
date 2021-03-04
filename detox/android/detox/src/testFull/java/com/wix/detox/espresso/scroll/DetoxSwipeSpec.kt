package com.wix.detox.espresso.scroll

import com.nhaarman.mockitokotlin2.*
import org.mockito.AdditionalMatchers
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe
import java.lang.Exception
import java.lang.RuntimeException

private fun floatEq3(value: Float) = AdditionalMatchers.eq(value, 0.001f)

object DetoxSwipeSpec: Spek({
    describe("Detox custom swipe") {
        val startX = 100f
        val startY = 200f
        val endX = 110f
        val endY = 220f

        lateinit var swiper: DetoxSwiper

        fun uut(motionCount: Int = 1): DetoxSwipe = DetoxSwipe(startX, startY, endX, endY, motionCount, swiper)

        beforeEachTest {
            swiper = mock {
                on { moveTo(any(), any()) }.doReturn(true)
            }
        }

        it("should start at coordinates") {
            uut().perform()
            verify(swiper).startAt(startX, startY)
        }

        it("should move once") {
            // start + (end - start) / N
            //    where N = (motionCount + 2)
            val expectedX = 103.333f
            val expectedY = 206.666f

            uut().perform()
            verify(swiper).moveTo(floatEq3(expectedX), floatEq3(expectedY))
            verify(swiper, times(1)).moveTo(any(), any())
        }

        it("should finish the swipe sequence") {
            uut().perform()
            verify(swiper).finishAt(endX, endY)
        }

        it("should finish even if motion fails") {
            whenever(swiper.moveTo(any(), any())).doThrow(RuntimeException())

            try {
                uut().perform()
            } catch (e: Exception) {
            }

            verify(swiper).finishAt(endX, endY)
        }

        it("should move in sub-steps") {
            val motionCount = 2
            val expectedX1 = 102.5f
            val expectedY1 = 205f
            val expectedX2 = 102.5f
            val expectedY2 = 205f

            uut(motionCount).perform()

            verify(swiper, times(1)).moveTo(eq(expectedX1), eq(expectedY1))
            verify(swiper, times(1)).moveTo(eq(expectedX2), eq(expectedY2))
            verify(swiper, times(2)).moveTo(any(), any())
        }

        it("should move in many sub-steps") {
            val motionCount = 10

            uut(motionCount).perform()

            verify(swiper, times(motionCount)).moveTo(any(), any())
        }

        it("should stop if motion fails") {
            val motionCount = 2

            whenever(swiper.moveTo(any(), any())).doReturn(false)

            uut(motionCount).perform()

            verify(swiper, times(1)).moveTo(any(), any())
        }
    }
})
