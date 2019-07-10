package com.wix.detox.espresso.scroll

import android.view.MotionEvent
import androidx.test.espresso.UiController
import com.nhaarman.mockitokotlin2.*
import com.wix.detox.espresso.common.MotionEvents
import org.junit.Before
import org.junit.Test
import java.lang.Exception
import java.lang.RuntimeException

class BatchedSwiperTest {

    val swipeStartTime = 1000L
    val perEventTime = 100L

    lateinit var uiController: UiController
    lateinit var downEvent: MotionEvent
    lateinit var moveEvent: MotionEvent
    lateinit var upEvent: MotionEvent
    lateinit var motionEvents: MotionEvents

    @Before fun setUp() {
        uiController = mock()
        downEvent = mock(name = "downEventMock") {
            on { downTime }.doReturn(swipeStartTime)
            on { eventTime }.doReturn(swipeStartTime)
        }
        moveEvent = mock(name = "moveEventMock") {
            on { downTime }.doReturn(swipeStartTime)
            on { eventTime }.doReturn(swipeStartTime + perEventTime)
        }
        upEvent = mock(name = "upEventMock") {
            on { downTime }.doReturn(swipeStartTime)
            on { eventTime }.doReturn(swipeStartTime + perEventTime * 2)
        }
        motionEvents = mock(name = "motionEventsMock") {
            on { obtainDownEvent(any(), any(), any()) }.doReturn(downEvent)
            on { obtainMoveEvent(any(), any(), any(), any()) }.doReturn(moveEvent)
            on { obtainUpEvent(any(), any(), any(), any()) }.doReturn(upEvent)
        }
    }

    @Test fun `should start by obtaining a down event`() {
        uut().startAt(666f, 999f)
        verify(motionEvents).obtainDownEvent(eq(666f), eq(999f), any())
    }

    @Test fun `should move by obtaining a move event`() {
        val expectedEventTime = swipeStartTime + perEventTime

        with(uut()) {
            startAt(666f, 999f)
            moveTo(111f, 222f)
        }
        verify(motionEvents).obtainMoveEvent(eq(downEvent), eq(expectedEventTime), eq(111f), eq(222f))
    }

    @Test fun `should finish by obtaining an up event`() {
        val expectedEventTime = swipeStartTime + perEventTime

        with(uut()) {
            startAt(666f, 999f)
            finishAt(123f, 234f)
        }
        verify(motionEvents).obtainUpEvent(downEvent, expectedEventTime, 123f, 234f)
    }

    @Test fun `should finish by flushing all events to ui controller`() {
        with(uut()) {
            startAt(0f, 0f)
            moveTo(1f, 1f)
            finishAt(2f, 2f)
        }
        verify(uiController).injectMotionEventSequence(eq(listOf(downEvent, moveEvent, upEvent)))
    }

    @Test fun `should finish by recycling all events`() {
        with(uut()) {
            startAt(0f, 0f)
            moveTo(1f, 1f)
            finishAt(2f, 2f)
        }

        verify(downEvent).recycle()
        verify(upEvent).recycle()
        verify(moveEvent).recycle()
    }

    @Test fun `should recycler all events event if ui controller fails`() {
        whenever(uiController.injectMotionEventSequence(any())).doThrow(RuntimeException())

        with(uut()) {
            startAt(0f, 0f)
            moveTo(1f, 1f)
            try {
                finishAt(2f, 2f)
            } catch (ex: Exception) {
            }
        }

        verify(downEvent).recycle()
        verify(upEvent).recycle()
        verify(moveEvent).recycle()
    }

    @Test fun `should wait for android to clear potential pressed-on states in views`() {
        val androidPressedOnDuration = 314
        with(uut(androidPressedOnDuration)) {
            startAt(0f, 0f)
            finishAt(2f, 2f)
        }
        verify(uiController).loopMainThreadForAtLeast(androidPressedOnDuration.toLong())
    }

    @Test fun `should not wait for android to clear pressed-on if duration is 0`() {
        with(uut(androidPressedOnDuration = 0)) {
            startAt(0f, 0f)
            finishAt(2f, 2f)
        }
        verify(uiController, never()).loopMainThreadForAtLeast(any())
    }

    private fun uut() = uut(0)
    private fun uut(androidPressedOnDuration: Int) = BatchedSwiper(uiController, perEventTime, motionEvents, androidPressedOnDuration)
}
