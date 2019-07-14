package com.wix.detox.espresso.scroll

import com.nhaarman.mockitokotlin2.*
import org.junit.Before
import org.junit.Test
import org.mockito.AdditionalMatchers
import java.lang.Exception
import java.lang.RuntimeException

fun floatEq3(value: Float) = AdditionalMatchers.eq(value, 0.001f)

class DetoxSwipeTest {
    private val startX = 100f
    private val startY = 200f
    private val endX = 110f
    private val endY = 220f

    private lateinit var swipeExecutor: DetoxSwiper

    @Before fun setUp() {
        swipeExecutor = mock {
            on { moveTo(any(), any()) }.doReturn(true)
        }
    }

    @Test fun `should generate swipe orchestrator`() {
        val swipeExecutorProvider: (perMotionTime: Int) -> DetoxSwiper = mock {
            onGeneric { invoke(any()) }.doReturn(swipeExecutor)
        }
        val swipeDuration = 500
        val motionCount = 10
        val expectedPerMotionTime = 50 // i.e. swipeDuration / motionsCount

        val uut = DetoxSwipe(0f, 0f, 1f, 1f, swipeDuration, motionCount, swipeExecutorProvider)
        uut.perform()

        verify(swipeExecutorProvider)(expectedPerMotionTime)
    }

    @Test fun `should start at coordinates`() {
        uut().perform()
        verify(swipeExecutor).startAt(startX, startY)
    }

    @Test fun `should move once`() {
        // start + (end - start) / N
        //    where N = (motionCount + 2)
        val expectedX = 103.333f
        val expectedY = 206.666f

        uut().perform()
        verify(swipeExecutor).moveTo(floatEq3(expectedX), floatEq3(expectedY))
        verify(swipeExecutor, times(1)).moveTo(any(), any())
    }

    @Test fun `should finish`() {
        uut().perform()
        verify(swipeExecutor).finishAt(endX, endY)
    }

    @Test fun `should finish even if motion fails`() {
        whenever(swipeExecutor.moveTo(any(), any())).doThrow(RuntimeException())

        try {
            uut().perform()
        } catch (e: Exception) {
        }

        verify(swipeExecutor).finishAt(endX, endY)
    }

    @Test fun `should move in sub-steps`() {
        val motionCount = 2
        val expectedX1 = 102.5f
        val expectedY1 = 205f
        val expectedX2 = 102.5f
        val expectedY2 = 205f

        uut(motionCount).perform()

        verify(swipeExecutor, times(1)).moveTo(eq(expectedX1), eq(expectedY1))
        verify(swipeExecutor, times(1)).moveTo(eq(expectedX2), eq(expectedY2))
        verify(swipeExecutor, times(2)).moveTo(any(), any())
    }

    @Test fun `should move in many sub-steps`() {
        val motionCount = 10

        uut(motionCount).perform()

        verify(swipeExecutor, times(motionCount)).moveTo(any(), any())
    }

    @Test fun `should stop if motion fails`() {
        val motionCount = 2

        whenever(swipeExecutor.moveTo(any(), any())).doReturn(false)

        uut(motionCount).perform()

        verify(swipeExecutor, times(1)).moveTo(any(), any())
    }

    private fun uut(motionCount: Int = 1): DetoxSwipe = DetoxSwipe(startX, startY, endX, endY, 100, motionCount) { swipeExecutor }
}
