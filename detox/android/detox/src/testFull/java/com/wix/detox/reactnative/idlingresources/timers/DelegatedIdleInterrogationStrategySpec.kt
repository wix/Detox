package com.wix.detox.reactnative.idlingresources.timers

import com.facebook.react.bridge.NativeModule
import com.nhaarman.mockitokotlin2.*
import org.assertj.core.api.Assertions.assertThat
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe

private const val BUSY_INTERVAL_MS = 1500L

abstract class TimingModuleStub: NativeModule {
    abstract fun hasActiveTimersInRange(rangeMs: Long): Boolean

    override fun onCatalystInstanceDestroy() {}
    override fun getName(): String = "TimersNativeModuleStub"
    override fun canOverrideExistingModule() = false
    override fun initialize() {}
}

object DelegatedIdleInterrogationStrategySpec : Spek({
    describe("RN62+ timers idle-interrogation strategy") {

        lateinit var timingModule: TimingModuleStub

        beforeEachTest {
            timingModule = mock()
        }

        fun givenActiveTimersInQueue() {
            whenever(timingModule.hasActiveTimersInRange(any())).thenReturn(true)
        }

        fun givenNoActiveTimersInQueue() {
            whenever(timingModule.hasActiveTimersInRange(any())).thenReturn(false)
        }

        fun uut() = DelegatedIdleInterrogationStrategy(timingModule)

        it("should be idle if timing module has no active timers") {
            givenNoActiveTimersInQueue()
            assertThat(uut().isIdleNow()).isTrue()
        }

        it("should be busy if timing module has active timers") {
            givenActiveTimersInQueue()
            assertThat(uut().isIdleNow()).isFalse()
        }

        it("should specify the busy-interval as the active-timers lookahead range") {
            givenActiveTimersInQueue()
            uut().isIdleNow()
            verify(timingModule).hasActiveTimersInRange(eq(BUSY_INTERVAL_MS))
        }
    }
})
