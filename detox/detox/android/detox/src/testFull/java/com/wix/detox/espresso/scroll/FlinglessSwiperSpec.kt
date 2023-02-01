package com.wix.detox.espresso.scroll

import android.view.MotionEvent
import android.view.ViewConfiguration
import androidx.test.espresso.UiController
import com.wix.detox.espresso.action.common.MotionEvents
import org.assertj.core.api.Assertions.assertThat
import org.mockito.kotlin.*
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe

object FlinglessSwiperSpec: Spek({
    describe("Flingless Swiper") {
        val swipeStartTime = 1000L

        lateinit var uiController: UiController
        lateinit var downEvent: MotionEvent
        lateinit var moveEvent: MotionEvent
        lateinit var upEvent: MotionEvent
        lateinit var motionEvents: MotionEvents
        lateinit var viewConfig: ViewConfiguration

        beforeEachTest {
            uiController = mock()
            downEvent = mock(name = "downEventMock") {
                on { downTime }.doReturn(swipeStartTime)
                on { eventTime }.doReturn(swipeStartTime)
            }
            moveEvent = mock(name = "moveEventMock") {
                on { downTime }.doReturn(swipeStartTime)
                on { eventTime }.doReturn(swipeStartTime)
            }
            upEvent = mock(name = "upEventMock") {
                on { downTime }.doReturn(swipeStartTime)
                on { eventTime }.doReturn(swipeStartTime)
            }
            motionEvents = mock(name = "motionEventsMock") {
                on { obtainDownEvent(any(), any(), any()) }.doReturn(downEvent)
                on { obtainMoveEvent(any(), any(), any(), any()) }.doReturn(moveEvent)
                on { obtainUpEvent(any(), any(), any(), any()) }.doReturn(upEvent)
            }
            viewConfig = mock()
        }

        fun uut(expectedMotions: Int = -1) = FlinglessSwiper(expectedMotions, uiController, viewConfig, motionEvents)

        describe("start") {
            it("should obtain a down event") {
                uut().startAt(666f, 999f)
                verify(motionEvents).obtainDownEvent(eq(666f), eq(999f), any())
            }

            it("should throw a descriptive error if already started") {
                var err: Exception? = null
                try {
                    with (uut()) {
                        startAt(666f, 999f)
                        startAt(667f, 998f)
                    }
                } catch (e: Exception) {
                    err = e
                }
                assertThat(err).isNotNull()
                assertThat(err).hasMessage("Swiper already started")
            }
        }

        describe("move") {
            val SWIPER_VELOCITY = 99f

            beforeEachTest {
                whenever(viewConfig.scaledMinimumFlingVelocity).doReturn(100) // i.e. we expect the swiper to apply a safety margin of 99%, hence actual velocity = 99 px/sec
            }

            it("should obtain a move event") {
                with(uut()) {
                    startAt(666f, 999f)
                    moveTo(111f, 222f)
                }
                verify(motionEvents).obtainMoveEvent(eq(downEvent), any(), eq(111f), eq(222f))
            }

            it("should throw descriptive error if moved before starting") {
                var err: Exception? = null
                try {
                    uut().moveTo(111f, 222f)
                } catch (e: Exception) {
                    err = e
                }
                assertThat(err).isNotNull()
                assertThat(err).hasMessage("Swiper not initialized - did you forget to call startAt()?")
            }

            describe("event time") {
                it("should set event time according to min fling speed config (1 second if distance=velocity)") {
                    val expectedEventTime = swipeStartTime + 1000L

                    with(uut()) {
                        startAt(0f, 0f)
                        moveTo(0f, SWIPER_VELOCITY)
                    }

                    verify(motionEvents).obtainMoveEvent(any(), eq(expectedEventTime), any(), any())
                }

                it("should set event time according to negative scroll direction") {
                    whenever(downEvent.y).doReturn(SWIPER_VELOCITY)

                    val expectedEventTime = swipeStartTime + 1000L

                    with(uut()) {
                        startAt(0f, SWIPER_VELOCITY)
                        moveTo(0f, 0f)
                    }

                    verify(motionEvents).obtainMoveEvent(any(), eq(expectedEventTime), any(), any())
                }

                it("should set event time proportional to min fling speed config (half the distance => half the time)") {
                    val expectedEventTime = swipeStartTime + 500L

                    with(uut()) {
                        startAt(0f, 0f)
                        moveTo(0f, SWIPER_VELOCITY/2)
                    }

                    verify(motionEvents).obtainMoveEvent(any(), eq(expectedEventTime), any(), any())
                }

                it("should apply a min event-time delta of 10ms") {
                    val expectedMinDelta = 10
                    val expectedEventTime = swipeStartTime + expectedMinDelta

                    with(uut()) {
                        startAt(0f, 0f)
                        moveTo(0f, .765f) // i.e. raw result is 9ms, but it won't be used
                    }

                    verify(motionEvents).obtainMoveEvent(any(), eq(expectedEventTime), any(), any())
                }

                it("should take x-axis movement into account in event time calcs") {
                    val expectedEventTime = swipeStartTime + 1000L

                    with(uut()) {
                        startAt(0f, 0f)
                        moveTo(SWIPER_VELOCITY, 0f)
                    }

                    verify(motionEvents).obtainMoveEvent(any(), eq(expectedEventTime), any(), any())
                }

                it("should optimize by applying fling-speed limitation only in last 25% of events") {
                    whenever(moveEvent.y).doReturn(255f)

                    with(uut(expectedMotions = 4)) {
                        startAt(0f, 0f)
                        moveTo(0f, 85f)
                        moveTo(0f, 170f)
                        moveTo(0f, 255f)
                        moveTo(0f, 340f)
                    }

                    verify(motionEvents, times(3)).obtainMoveEvent(any(), eq(swipeStartTime + 10L), any(), any())
                    verify(motionEvents, times(1)).obtainMoveEvent(any(), eq(swipeStartTime + 858), any(), any())
                }
            }
        }

        describe("finish") {
            it("should throw descriptive error if not started") {
                var err: Exception? = null
                try {
                    with (uut()) {
                        finishAt(1f, 1f)
                    }
                } catch (e: Exception) {
                    err = e
                }
                assertThat(err).isNotNull()
                assertThat(err).hasMessage("Swiper not initialized - did you forget to call startAt()?")
            }

            it("should finish by obtaining an up event") {
                whenever(downEvent.x).doReturn(666f)
                whenever(downEvent.y).doReturn(999f)
                whenever(viewConfig.scaledMinimumFlingVelocity).doReturn(100)

                val expectedEventTime = swipeStartTime + 1000L

                with(uut()) {
                    startAt(666f, 999f)
                    finishAt(666f + 99f, 999f + 99f)
                }
                verify(motionEvents).obtainUpEvent(downEvent, expectedEventTime, 666f + 99f, 999f + 99f)
            }

            it("should finish by flushing all events to ui controller") {
                with(uut()) {
                    startAt(0f, 0f)
                    moveTo(1f, 1f)
                    finishAt(2f, 2f)
                }
                verify(uiController).injectMotionEventSequence(eq(listOf(downEvent, moveEvent, upEvent)))
            }

            it("should finish by recycling all events") {
                with(uut()) {
                    startAt(0f, 0f)
                    moveTo(1f, 1f)
                    finishAt(2f, 2f)
                }

                verify(downEvent).recycle()
                verify(upEvent).recycle()
                verify(moveEvent).recycle()
            }

            it("should recycle all events even if ui controller fails") {
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
        }
    }
})
