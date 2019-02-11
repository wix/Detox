package com.wix.detox.espresso

import android.support.test.espresso.IdlingResource.ResourceCallback
import android.view.Choreographer
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.Timing
import com.nhaarman.mockito_kotlin.*
import com.wix.detox.UTHelpers.yieldToOtherThreads
import org.assertj.core.api.Assertions.assertThat
import org.joor.Reflect
import org.junit.Before
import org.junit.Test
import org.mockito.ArgumentMatchers
import java.util.*
import java.util.concurrent.Executors

const val BUSY_INTERVAL_MS = 1500
const val MEANINGFUL_TIMER_INTERVAL = BUSY_INTERVAL_MS

fun now() = System.nanoTime() / 1000000L

fun aTimer(interval: Int, isRepeating: Boolean) = aTimer(now() + interval + 10, interval, isRepeating)

fun aTimer(targetTime: Long, interval: Int, isRepeating: Boolean): Any {
    val timerClass = Class.forName("com.facebook.react.modules.core.Timing\$Timer")
    return Reflect.on(timerClass).create(-1, targetTime, interval, isRepeating).get()
}

fun aOneShotTimer(interval: Int) = aTimer(interval, false)
fun aRepeatingTimer(interval: Int) = aTimer(interval, true)
fun anOverdueTimer() = aTimer(now() - 100, 123, false)

fun anIdlingResourceCallback() = mock<ResourceCallback>()

class ReactNativeTimersIdlingResourceTest {

    private lateinit var reactAppContext: ReactApplicationContext
    private lateinit var timersLock: String
    private lateinit var timersNativeModule: Timing
    private lateinit var choreographer: Choreographer
    private lateinit var pendingTimers: PriorityQueue<Any>

    @Before fun setUp() {
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

    @Test fun `should be idle if there are no timers in queue`() {
        assertThat(uut().isIdleNow).isTrue()
    }

    @Test fun `should transition to idle if found idle in query`() {
        val callback = anIdlingResourceCallback()

        with(uut()) {
            registerIdleTransitionCallback(callback)
            isIdleNow
        }

        verify(callback).onTransitionToIdle()
    }

    @Test fun `should NOT transition to idle if found busy in query`() {
        val callback = anIdlingResourceCallback()

        givenTimer(aOneShotTimer(MEANINGFUL_TIMER_INTERVAL))

        with(uut()) {
            registerIdleTransitionCallback(callback)
            isIdleNow
        }

        verify(callback, never()).onTransitionToIdle()
    }

    @Test fun `should be busy if there's a meaningful pending timer`() {
        givenTimer(aOneShotTimer(MEANINGFUL_TIMER_INTERVAL))
        assertThat(uut().isIdleNow).isFalse()
    }

    @Test fun `should be idle if pending timer is too far away (ie not meaningful)`() {
        givenTimer(aOneShotTimer(BUSY_INTERVAL_MS + 1))
        assertThat(uut().isIdleNow).isTrue()
    }

    @Test fun `should be idle if the only timer is a repeating one`() {
        givenTimer(aRepeatingTimer(MEANINGFUL_TIMER_INTERVAL))
        assertThat(uut().isIdleNow).isTrue()
    }

    @Test fun `should be busy if a meaningful pending timer lies beyond a repeating one`() {
        givenTimer(aRepeatingTimer(BUSY_INTERVAL_MS / 10))
        givenTimer(aOneShotTimer(BUSY_INTERVAL_MS))
        assertThat(uut().isIdleNow).isFalse()
    }

    @Test fun `should be idle if the only timer is overdue (due in the past)`() {
        givenTimer(anOverdueTimer())
        assertThat(uut().isIdleNow).isTrue()
    }

    @Test fun `should be busy if has a meaningful pending timer set beyond an overdue timer`() {
        givenTimer(anOverdueTimer())
        givenTimer(aOneShotTimer(MEANINGFUL_TIMER_INTERVAL))
        assertThat(uut().isIdleNow).isFalse()
    }

    @Test fun `should be idle if paused`() {
        givenTimer(aOneShotTimer(MEANINGFUL_TIMER_INTERVAL))

        val uut = uut().apply {
            pause()
        }

        assertThat(uut.isIdleNow).isTrue()
    }

    @Test fun `should be busy if paused and resumed`() {
        givenTimer(aOneShotTimer(MEANINGFUL_TIMER_INTERVAL))

        val uut = uut().apply {
            pause()
            resume()
        }

        assertThat(uut.isIdleNow).isFalse()
    }

    @Test fun `should notify of transition to idle upon pausing`() {
        val callback = anIdlingResourceCallback()

        givenTimer(aOneShotTimer(MEANINGFUL_TIMER_INTERVAL))

        with(uut()) {
            registerIdleTransitionCallback(callback)
            pause()
        }

        verify(callback).onTransitionToIdle()
    }

    @Test fun `should enqueue an is-idle check using choreographer when a callback gets registered`() {
        with(uut()) {
            registerIdleTransitionCallback(mock())
        }

        verify(choreographer).postFrameCallback(any())
    }

    @Test fun `should transition to idle when preregistered choreographer is dispatched`() {
        val callback = anIdlingResourceCallback()

        uut().registerIdleTransitionCallback(callback)
        invokeChoreographerCallback()

        verify(callback).onTransitionToIdle()
    }

    @Test fun `should NOT transition to idle if not idle when preregistered choreographer is dispatched`() {
        val callback = anIdlingResourceCallback()

        givenTimer(aOneShotTimer(MEANINGFUL_TIMER_INTERVAL))

        uut().registerIdleTransitionCallback(callback)
        invokeChoreographerCallback()

        verify(callback, never()).onTransitionToIdle()
    }

    @Test fun `should re-register choreographer if found idle while preregistered choreographer is dispatched`() {
        val callback = anIdlingResourceCallback()

        givenTimer(aOneShotTimer(MEANINGFUL_TIMER_INTERVAL))

        val uut = uut()
        uut.registerIdleTransitionCallback(callback)
        invokeChoreographerCallback()

        verify(choreographer, times(2)).postFrameCallback(any())
    }

    @Test fun `should adhere to pausing also when invoked via choreographer callback`() {
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

    @Test fun `should enqueue an additional idle check (using choreographer) if found busy`() {
        givenTimer(aOneShotTimer(MEANINGFUL_TIMER_INTERVAL))
        uut().isIdleNow
        verify(choreographer).postFrameCallback(any())
    }

    @Test fun `should NOT enqueue an additional idle check (using choreographer) if found idle`() {
        givenTimer(aOneShotTimer(BUSY_INTERVAL_MS + 1))
        uut().isIdleNow
        verify(choreographer, never()).postFrameCallback(any())
    }

    @Test fun `should yield to other threads using the timers module`() {
        val executor = Executors.newSingleThreadExecutor()
        var isIdle: Boolean? = null

        synchronized(timersLock) {
            executor.submit {
                isIdle = uut().isIdleNow
            }
            yieldToOtherThreads(executor)
            assertThat(isIdle).isNull()
        }
        yieldToOtherThreads(executor)
        assertThat(isIdle).isNotNull()
    }

    private fun uut() = ReactNativeTimersIdlingResource(reactAppContext) { choreographer }

    private fun givenTimer(timer: Any) {
        pendingTimers.add(timer)
    }

    private fun invokeChoreographerCallback() {
        getChoreographerCallback().doFrame(0L)
    }

    private fun getChoreographerCallback(): Choreographer.FrameCallback {
        argumentCaptor<Choreographer.FrameCallback>().apply {
            verify(choreographer).postFrameCallback(capture())
            return firstValue
        }
    }
}
