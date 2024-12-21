package com.wix.detox.reactnative.idlingresources.timers

import android.view.Choreographer
import androidx.test.espresso.IdlingResource
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.TimingModule
import org.assertj.core.api.Assertions
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.*
import org.robolectric.RobolectricTestRunner
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe

private fun anIdlingResourceCallback() = mock<IdlingResource.ResourceCallback>()

@RunWith(RobolectricTestRunner::class)
class TimersIdlingResourceTest {
    private val choreographer: Choreographer = mock()
    private val context: ReactContext = mock()
    private val timersModule: TimingModule = mock()
    private lateinit var timersIdlingResource: TimersIdlingResource

    @Before
    fun setup() {
        whenever(context.getNativeModule(eq(TimingModule::class.java))).thenReturn(timersModule)
        timersIdlingResource = TimersIdlingResource(context) { choreographer }
    }


    private fun givenIdleStrategy() {
        whenever(timersModule.hasActiveTimersInRange(any())).thenReturn(false)
    }

    private fun givenBusyStrategy() {
        whenever(timersModule.hasActiveTimersInRange(any())).thenReturn(true)
    }

    private fun getChoreographerCallback(): Choreographer.FrameCallback {
        argumentCaptor<Choreographer.FrameCallback>().apply {
            verify(choreographer).postFrameCallback(capture())
            return firstValue
        }
    }

    private fun invokeChoreographerCallback() {
        getChoreographerCallback().doFrame(0L)
    }

    @Test
    fun `should return a debug-name`() {
        Assertions.assertThat(timersIdlingResource.getDebugName()).isEqualTo("timers")
    }

    @Test
    fun `should be idle if strategy says so`() {
        givenIdleStrategy()
        Assertions.assertThat(timersIdlingResource.isIdleNow).isTrue()
    }

    @Test
    fun `should be busy if strategy says so`() {
        givenBusyStrategy()
        Assertions.assertThat(timersIdlingResource.isIdleNow).isFalse()
    }

    @Test
    fun `should transition to idle if found idle by strategy`() {
        givenIdleStrategy()

        val callback = anIdlingResourceCallback()

        with(timersIdlingResource) {
            registerIdleTransitionCallback(callback)
            isIdleNow
        }

        verify(callback).onTransitionToIdle()
    }

    @Test
    fun `should NOT transition to idle if found busy by strategy`() {
        givenBusyStrategy()

        val callback = anIdlingResourceCallback()

        with(timersIdlingResource) {
            registerIdleTransitionCallback(callback)
            isIdleNow
        }

        verify(callback, never()).onTransitionToIdle()
    }

    @Test
    fun `should be idle if paused`() {
        givenBusyStrategy()

        val uut = timersIdlingResource.apply {
            pause()
        }

        Assertions.assertThat(uut.isIdleNow).isTrue()
    }

    @Test
    fun `should be busy if paused and resumed`() {
        givenBusyStrategy()

        val uut = timersIdlingResource.apply {
            pause()
            resume()
        }

        Assertions.assertThat(uut.isIdleNow).isFalse()
    }

    @Test
    fun `should notify of transition to idle upon pausing`() {
        givenBusyStrategy()

        val callback = anIdlingResourceCallback()

        with(timersIdlingResource) {
            registerIdleTransitionCallback(callback)
            pause()
        }

        verify(callback).onTransitionToIdle()
    }

    @Test
    fun `should enqueue an is-idle check using choreographer when a callback gets registered`() {
        with(timersIdlingResource) {
            registerIdleTransitionCallback(mock())
        }

        verify(choreographer).postFrameCallback(any())
    }

    @Test
    fun `should transition to idle when preregistered choreographer is dispatched`() {
        givenIdleStrategy()

        val callback = anIdlingResourceCallback()

        timersIdlingResource.registerIdleTransitionCallback(callback)
        invokeChoreographerCallback()

        verify(callback).onTransitionToIdle()
    }

    @Test
    fun `should NOT transition to idle if not idle when preregistered choreographer is dispatched`() {
        givenBusyStrategy()

        val callback = anIdlingResourceCallback()

        timersIdlingResource.registerIdleTransitionCallback(callback)
        invokeChoreographerCallback()

        verify(callback, never()).onTransitionToIdle()
    }

    @Test
    fun `should re-register choreographer if found idle while preregistered choreographer is dispatched`() {
        givenBusyStrategy()

        val callback = anIdlingResourceCallback()

        val uut = timersIdlingResource
        uut.registerIdleTransitionCallback(callback)
        invokeChoreographerCallback()

        verify(choreographer, times(2)).postFrameCallback(any())
    }

    @Test
    fun `should adhere to pausing also when invoked via choreographer callback`() {
        givenBusyStrategy()

        val callback = anIdlingResourceCallback()

        timersIdlingResource.apply {
            pause()
            registerIdleTransitionCallback(callback)
        }
        val runtimeChoreographerCallback = getChoreographerCallback()

        reset(callback, choreographer)
        runtimeChoreographerCallback.doFrame(0L)

        verify(callback, never()).onTransitionToIdle()
        verify(choreographer, never()).postFrameCallback(any())
    }

    @Test
    fun `should enqueue an additional idle check (using choreographer) if found busy`() {
        givenBusyStrategy()
        timersIdlingResource.isIdleNow
        verify(choreographer).postFrameCallback(any())
    }

    @Test
    fun `should NOT enqueue an additional idle check (using choreographer) if found idle`() {
        givenIdleStrategy()
        timersIdlingResource.isIdleNow
        verify(choreographer, never()).postFrameCallback(any())
    }
}

