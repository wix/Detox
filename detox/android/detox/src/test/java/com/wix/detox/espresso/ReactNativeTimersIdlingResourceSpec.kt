package com.wix.detox.espresso

import android.view.Choreographer
import androidx.test.espresso.IdlingResource
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.Timing
import com.nhaarman.mockitokotlin2.*
import com.wix.detox.UTHelpers.yieldToOtherThreads
import org.assertj.core.api.Assertions
import org.joor.Reflect
import org.mockito.ArgumentMatchers
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe
import java.util.*
import java.util.concurrent.Executors

private const val BUSY_INTERVAL_MS = 1500
private const val MEANINGFUL_TIMER_INTERVAL = BUSY_INTERVAL_MS

private fun now() = System.nanoTime() / 1000000L

private fun aTimer(interval: Int, isRepeating: Boolean) = aTimer(now() + interval + 10, interval, isRepeating)

private fun aTimer(targetTime: Long, interval: Int, isRepeating: Boolean): Any {
    val timerClass = Class.forName("com.facebook.react.modules.core.Timing\$Timer")
    return Reflect.on(timerClass).create(-1, targetTime, interval, isRepeating).get()
}

private fun aOneShotTimer(interval: Int) = aTimer(interval, false)
private fun aRepeatingTimer(interval: Int) = aTimer(interval, true)
private fun anOverdueTimer() = aTimer(now() - 100, 123, false)

private fun anIdlingResourceCallback() = mock<IdlingResource.ResourceCallback>()

object ReactNativeTimersIdlingResourceSpec : Spek({
    describe("React Native timers idling-resource") {
        lateinit var reactAppContext: ReactApplicationContext
        lateinit var timersLock: String
        lateinit var timersNativeModule: Timing
        lateinit var choreographer: Choreographer
        lateinit var pendingTimers: PriorityQueue<Any>

        fun uut() = ReactNativeTimersIdlingResource(reactAppContext) { choreographer }

        fun givenTimer(timer: Any) {
            pendingTimers.add(timer)
        }

        fun getChoreographerCallback(): Choreographer.FrameCallback {
            argumentCaptor<Choreographer.FrameCallback>().apply {
                verify(choreographer).postFrameCallback(capture())
                return firstValue
            }
        }

        fun invokeChoreographerCallback() {
            getChoreographerCallback().doFrame(0L)
        }

        beforeEachTest {
            pendingTimers = PriorityQueue(2) { _, _ -> 0}

            timersNativeModule = mock()
            timersLock = "Lock-Mock"
            Reflect.on(timersNativeModule).set("mTimers", pendingTimers)
            Reflect.on(timersNativeModule).set("mTimerGuard", timersLock)

            choreographer = mock()

            reactAppContext = mock {
                on { hasNativeModule<Timing>(ArgumentMatchers.any()) }.doReturn(true)
                on { getNativeModule<Timing>(ArgumentMatchers.any()) }.doReturn(timersNativeModule)
            }
        }

        it("should be idle if there are no timers in queue") {
            Assertions.assertThat(uut().isIdleNow).isTrue()
        }

        it("should transition to idle if found idle in query") {
            val callback = anIdlingResourceCallback()

            with(uut()) {
                registerIdleTransitionCallback(callback)
                isIdleNow
            }

            verify(callback).onTransitionToIdle()
        }

        it("should NOT transition to idle if found busy in query") {
            val callback = anIdlingResourceCallback()

            givenTimer(aOneShotTimer(MEANINGFUL_TIMER_INTERVAL))

            with(uut()) {
                registerIdleTransitionCallback(callback)
                isIdleNow
            }

            verify(callback, never()).onTransitionToIdle()
        }

        it("should be busy if there's a meaningful pending timer") {
            givenTimer(aOneShotTimer(MEANINGFUL_TIMER_INTERVAL))
            Assertions.assertThat(uut().isIdleNow).isFalse()
        }

        it("should be idle if pending timer is too far away (ie not meaningful)") {
            givenTimer(aOneShotTimer(BUSY_INTERVAL_MS + 1))
            Assertions.assertThat(uut().isIdleNow).isTrue()
        }

        it("should be idle if the only timer is a repeating one") {
            givenTimer(aRepeatingTimer(MEANINGFUL_TIMER_INTERVAL))
            Assertions.assertThat(uut().isIdleNow).isTrue()
        }

        it("should be busy if a meaningful pending timer lies beyond a repeating one") {
            givenTimer(aRepeatingTimer(BUSY_INTERVAL_MS / 10))
            givenTimer(aOneShotTimer(BUSY_INTERVAL_MS))
            Assertions.assertThat(uut().isIdleNow).isFalse()
        }

        /**
         * Note: Reversed logic due to this issue: https://github.com/wix/Detox/issues/1171 !!!
         *
         * Apparently at times (rare) this caused Espresso to think we're idle too soon, rendering
         * it never to query any idling resource again even after the timer effectively expires...
         */
        it("should be *busy* even if all timers are overdue") {
            givenTimer(anOverdueTimer())
            givenTimer(anOverdueTimer())
            Assertions.assertThat(uut().isIdleNow).isFalse()
        }

        it("should be busy if has a meaningful pending timer set beyond an overdue timer") {
            givenTimer(anOverdueTimer())
            givenTimer(aOneShotTimer(MEANINGFUL_TIMER_INTERVAL))
            Assertions.assertThat(uut().isIdleNow).isFalse()
        }

        it("should be idle if paused") {
            givenTimer(aOneShotTimer(MEANINGFUL_TIMER_INTERVAL))

            val uut = uut().apply {
                pause()
            }

            Assertions.assertThat(uut.isIdleNow).isTrue()
        }

        it("should be busy if paused and resumed") {
            givenTimer(aOneShotTimer(MEANINGFUL_TIMER_INTERVAL))

            val uut = uut().apply {
                pause()
                resume()
            }

            Assertions.assertThat(uut.isIdleNow).isFalse()
        }

        it("should notify of transition to idle upon pausing") {
            val callback = anIdlingResourceCallback()

            givenTimer(aOneShotTimer(MEANINGFUL_TIMER_INTERVAL))

            with(uut()) {
                registerIdleTransitionCallback(callback)
                pause()
            }

            verify(callback).onTransitionToIdle()
        }

        it("should enqueue an is-idle check using choreographer when a callback gets registered") {
            with(uut()) {
                registerIdleTransitionCallback(mock())
            }

            verify(choreographer).postFrameCallback(any())
        }

        it("should transition to idle when preregistered choreographer is dispatched") {
            val callback = anIdlingResourceCallback()

            uut().registerIdleTransitionCallback(callback)
            invokeChoreographerCallback()

            verify(callback).onTransitionToIdle()
        }

        it("should NOT transition to idle if not idle when preregistered choreographer is dispatched") {
            val callback = anIdlingResourceCallback()

            givenTimer(aOneShotTimer(MEANINGFUL_TIMER_INTERVAL))

            uut().registerIdleTransitionCallback(callback)
            invokeChoreographerCallback()

            verify(callback, never()).onTransitionToIdle()
        }

        it("should re-register choreographer if found idle while preregistered choreographer is dispatched") {
            val callback = anIdlingResourceCallback()

            givenTimer(aOneShotTimer(MEANINGFUL_TIMER_INTERVAL))

            val uut = uut()
            uut.registerIdleTransitionCallback(callback)
            invokeChoreographerCallback()

            verify(choreographer, times(2)).postFrameCallback(any())
        }

        it("should adhere to pausing also when invoked via choreographer callback") {
            val callback = anIdlingResourceCallback()

            givenTimer(aOneShotTimer(MEANINGFUL_TIMER_INTERVAL))

            uut().apply {
                pause()
                registerIdleTransitionCallback(callback)
            }
            val runtimeChoreographerCallback = getChoreographerCallback()

            reset(callback, choreographer)
            runtimeChoreographerCallback.doFrame(0L)

            verify(callback, never()).onTransitionToIdle()
            verify(choreographer, never()).postFrameCallback(any())
        }

        it("should enqueue an additional idle check (using choreographer) if found busy") {
            givenTimer(aOneShotTimer(MEANINGFUL_TIMER_INTERVAL))
            uut().isIdleNow
            verify(choreographer).postFrameCallback(any())
        }

        it("should NOT enqueue an additional idle check (using choreographer) if found idle") {
            givenTimer(aOneShotTimer(BUSY_INTERVAL_MS + 1))
            uut().isIdleNow
            verify(choreographer, never()).postFrameCallback(any())
        }

        it("should yield to other threads using the timers module") {
            val executor = Executors.newSingleThreadExecutor()
            var isIdle: Boolean? = null

            synchronized(timersLock) {
                executor.submit {
                    isIdle = uut().isIdleNow
                }
                yieldToOtherThreads(executor)
                Assertions.assertThat(isIdle).isNull()
            }
            yieldToOtherThreads(executor)
            Assertions.assertThat(isIdle).isNotNull()
        }
    }
})
