package com.wix.detox.reactnative.idlingresources.timers

import android.view.Choreographer
import androidx.test.espresso.IdlingResource
import com.nhaarman.mockitokotlin2.*
import org.assertj.core.api.Assertions
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe

private fun anIdlingResourceCallback() = mock<IdlingResource.ResourceCallback>()

object TimersIdlingResourceSpec : Spek({
    describe("React Native timers idling-resource") {
        lateinit var choreographer: Choreographer
        lateinit var idleInterrogationStrategy: IdleInterrogationStrategy

        beforeEachTest {
            idleInterrogationStrategy = mock()
            choreographer = mock()
        }

        fun uut() = TimersIdlingResource(idleInterrogationStrategy) { choreographer }

        fun givenIdleStrategy() {
            whenever(idleInterrogationStrategy.isIdleNow()).thenReturn(true)
        }

        fun givenBusyStrategy() {
            whenever(idleInterrogationStrategy.isIdleNow()).thenReturn(false)
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

        it("should be idle if strategy says so") {
            givenIdleStrategy()
            Assertions.assertThat(uut().isIdleNow).isTrue()
        }

        it("should be busy if strategy says so") {
            givenBusyStrategy()
            Assertions.assertThat(uut().isIdleNow).isFalse()
        }

        it("should transition to idle if found idle by strategy") {
            givenIdleStrategy()

            val callback = anIdlingResourceCallback()

            with(uut()) {
                registerIdleTransitionCallback(callback)
                isIdleNow
            }

            verify(callback).onTransitionToIdle()
        }

        it("should NOT transition to idle if found busy by strategy") {
            givenBusyStrategy()

            val callback = anIdlingResourceCallback()

            with(uut()) {
                registerIdleTransitionCallback(callback)
                isIdleNow
            }

            verify(callback, never()).onTransitionToIdle()
        }

        it("should be idle if paused") {
            givenBusyStrategy()

            val uut = uut().apply {
                pause()
            }

            Assertions.assertThat(uut.isIdleNow).isTrue()
        }

        it("should be busy if paused and resumed") {
            givenBusyStrategy()

            val uut = uut().apply {
                pause()
                resume()
            }

            Assertions.assertThat(uut.isIdleNow).isFalse()
        }

        it("should notify of transition to idle upon pausing") {
            givenBusyStrategy()

            val callback = anIdlingResourceCallback()

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
            givenIdleStrategy()

            val callback = anIdlingResourceCallback()

            uut().registerIdleTransitionCallback(callback)
            invokeChoreographerCallback()

            verify(callback).onTransitionToIdle()
        }

        it("should NOT transition to idle if not idle when preregistered choreographer is dispatched") {
            givenBusyStrategy()

            val callback = anIdlingResourceCallback()

            uut().registerIdleTransitionCallback(callback)
            invokeChoreographerCallback()

            verify(callback, never()).onTransitionToIdle()
        }

        it("should re-register choreographer if found idle while preregistered choreographer is dispatched") {
            givenBusyStrategy()

            val callback = anIdlingResourceCallback()

            val uut = uut()
            uut.registerIdleTransitionCallback(callback)
            invokeChoreographerCallback()

            verify(choreographer, times(2)).postFrameCallback(any())
        }

        it("should adhere to pausing also when invoked via choreographer callback") {
            givenBusyStrategy()

            val callback = anIdlingResourceCallback()

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
            givenBusyStrategy()
            uut().isIdleNow
            verify(choreographer).postFrameCallback(any())
        }

        it("should NOT enqueue an additional idle check (using choreographer) if found idle") {
            givenIdleStrategy()
            uut().isIdleNow
            verify(choreographer, never()).postFrameCallback(any())
        }
    }
})
