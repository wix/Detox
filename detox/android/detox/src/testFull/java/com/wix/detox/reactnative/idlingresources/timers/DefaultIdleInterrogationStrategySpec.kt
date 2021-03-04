package com.wix.detox.reactnative.idlingresources.timers

import com.facebook.react.bridge.NativeModule
import com.wix.detox.UTHelpers
import org.assertj.core.api.Assertions
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe
import java.util.*
import java.util.concurrent.Executors

private const val BUSY_INTERVAL_MS = 1500
private const val MEANINGFUL_TIMER_INTERVAL = BUSY_INTERVAL_MS

data class TimerStub(
        private var mCallbackID: Int,
        private var mTargetTime: Long,
        private var mInterval: Int,
        private var mRepeat: Boolean)

class TimersNativeModuleStub : NativeModule {
    val mTimers: PriorityQueue<Any> = PriorityQueue(2) { _, _ -> 0}
    val mTimerGuard = "Lock-Mock"

    override fun onCatalystInstanceDestroy() {}
    override fun getName(): String = "TimersNativeModuleStub"
    override fun canOverrideExistingModule() = false
    override fun initialize() {}
}

private fun now() = System.nanoTime() / 1000000L
private fun aTimer(targetTime: Long, interval: Int, isRepeating: Boolean): TimerStub {
    return TimerStub(-1, targetTime, interval, isRepeating)
}
private fun aTimer(interval: Int, isRepeating: Boolean) = aTimer(now() + interval + 10, interval, isRepeating)
private fun aOneShotTimer(interval: Int) = aTimer(interval, false)
private fun aRepeatingTimer(interval: Int) = aTimer(interval, true)
private fun anOverdueTimer() = aTimer(now() - 100, 123, false)

object DefaultIdleInterrogationStrategySpec: Spek({
  describe("Default timers idle-interrogation strategy") {

      lateinit var timersNativeModule: TimersNativeModuleStub

      beforeEachTest {
          timersNativeModule = TimersNativeModuleStub()
      }

      fun givenTimer(timer: Any) {
          timersNativeModule.mTimers.add(timer)
      }

      fun uut() = DefaultIdleInterrogationStrategy(timersNativeModule)

      it("should be idle if there are no timers in queue") {
          Assertions.assertThat(uut().isIdleNow()).isTrue()
      }

      it("should be busy if there's a meaningful pending timer") {
          givenTimer(aOneShotTimer(MEANINGFUL_TIMER_INTERVAL))
          Assertions.assertThat(uut().isIdleNow()).isFalse()
      }

      it("should be idle if pending timer is too far away (ie not meaningful)") {
          givenTimer(aOneShotTimer(BUSY_INTERVAL_MS + 1))
          Assertions.assertThat(uut().isIdleNow()).isTrue()
      }

      it("should be idle if the only timer is a repeating one") {
          givenTimer(aRepeatingTimer(MEANINGFUL_TIMER_INTERVAL))
          Assertions.assertThat(uut().isIdleNow()).isTrue()
      }

      it("should be busy if a meaningful pending timer lies beyond a repeating one") {
          givenTimer(aRepeatingTimer(BUSY_INTERVAL_MS / 10))
          givenTimer(aOneShotTimer(BUSY_INTERVAL_MS))
          Assertions.assertThat(uut().isIdleNow()).isFalse()
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
          Assertions.assertThat(uut().isIdleNow()).isFalse()
      }

      it("should be busy if has a meaningful pending timer set beyond an overdue timer") {
          givenTimer(anOverdueTimer())
          givenTimer(aOneShotTimer(MEANINGFUL_TIMER_INTERVAL))
          Assertions.assertThat(uut().isIdleNow()).isFalse()
      }

      it("should yield to other threads using the timers module") {
          val executor = Executors.newSingleThreadExecutor()
          var isIdle: Boolean? = null

          synchronized(timersNativeModule.mTimerGuard) {
              executor.submit {
                  isIdle = uut().isIdleNow()
              }
              UTHelpers.yieldToOtherThreads(executor)
              Assertions.assertThat(isIdle).isNull()
          }
          UTHelpers.yieldToOtherThreads(executor)
          Assertions.assertThat(isIdle).isNotNull()
          executor.shutdownNow()
      }
  }
})
