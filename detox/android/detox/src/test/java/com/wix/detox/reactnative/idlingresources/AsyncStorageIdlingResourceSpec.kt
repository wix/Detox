package com.wix.detox.reactnative.idlingresources

import androidx.test.espresso.IdlingResource
import com.facebook.react.bridge.NativeModule
import com.nhaarman.mockitokotlin2.*
import com.wix.detox.UTHelpers.yieldToOtherThreads
import org.assertj.core.api.Assertions.assertThat
import org.spekframework.spek2.Spek
import org.spekframework.spek2.style.specification.describe
import java.util.concurrent.Executor
import java.util.concurrent.Executors

private class AsyncStorageModuleStub: NativeModule {
    val executor: Executor = mock(name = "native-module's executor")
    override fun getName() = "stub"
    override fun initialize() {}
    override fun canOverrideExistingModule() = false
    override fun onCatalystInstanceDestroy() {}
}

class AsyncStorageIdlingResourceSpec: Spek({
    describe("React Native Async-Storage idling-resource") {
        lateinit var sexecutor: Executor
        lateinit var sexecutorReflected: SerialExecutorReflected
        lateinit var sexecutorReflectedGenFn: (executor: Executor) -> SerialExecutorReflected
        lateinit var module: AsyncStorageModuleStub
        lateinit var uut: AsyncStorageIdlingResource

        beforeEachTest {
            sexecutor = mock()
            module = AsyncStorageModuleStub()
            sexecutorReflected = mock() {
                on { executor() }.thenReturn(sexecutor)
            }
            sexecutorReflectedGenFn = mock() {
                on { invoke(eq(module.executor)) }.thenReturn(sexecutorReflected)
            }


            uut = AsyncStorageIdlingResource(module, sexecutorReflectedGenFn)
        }

        fun givenNoActiveTasks() = whenever(sexecutorReflected.hasActiveTask()).thenReturn(false)
        fun givenAnActiveTask() = whenever(sexecutorReflected.hasActiveTask()).thenReturn(true)
        fun givenNoPendingTasks() = whenever(sexecutorReflected.hasPendingTasks()).thenReturn(false)
        fun givenPendingTasks() = whenever(sexecutorReflected.hasPendingTasks()).thenReturn(true)
        fun givenIdleSExecutor() {
            givenNoActiveTasks()
            givenNoPendingTasks()
        }
        fun givenBusySExecutor() {
            givenAnActiveTask()
            givenNoPendingTasks()
        }
        fun verifyNoTasksEnqueued() = verify(sexecutorReflected, never()).executeTask(any())
        fun verifyTaskEnqueuedOnce() = verify(sexecutorReflected, times(1)).executeTask(any())
        fun verifyTaskEnqueuedTwice() = verify(sexecutorReflected, times(2)).executeTask(any())

        it("should have a name") {
            assertThat(uut.name).isEqualTo("com.wix.detox.reactnative.idlingresources.AsyncStorageIdlingResource")
        }

        describe("idle-checking") {
            it("should be idle") {
                givenIdleSExecutor()
                assertThat(uut.isIdleNow).isTrue()
            }

            it("should be busy if executor is executing") {
                givenAnActiveTask()
                givenNoPendingTasks()
                assertThat(uut.isIdleNow).isFalse()
            }

            it("should be busy if executor has pending tasks") {
                givenNoActiveTasks()
                givenPendingTasks()
                assertThat(uut.isIdleNow).isFalse()
            }

            it("should be synchronized over actual executor") {
                val localExecutor = Executors.newSingleThreadExecutor()
                var isIdle: Boolean? = null
                synchronized(sexecutor) {
                    localExecutor.submit {
                        isIdle = uut.isIdleNow
                    }
                    yieldToOtherThreads(localExecutor)
                    assertThat(isIdle).isNull()
                }
                yieldToOtherThreads(localExecutor)
            }

            it("should enqueue an idle-check task if resource is busy") {
                givenBusySExecutor()
                uut.isIdleNow
                verifyTaskEnqueuedOnce()
            }

            it("should not enqueue an idle-check task if resource if idle") {
                givenIdleSExecutor()
                uut.isIdleNow
                verifyNoTasksEnqueued()
            }

            it("should not enqueue more than one idle-check task") {
                givenBusySExecutor()

                repeat(2) {
                    uut.isIdleNow
                }
                verifyTaskEnqueuedOnce()
            }
        }

        describe("callback registration") {
            lateinit var callback: IdlingResource.ResourceCallback

            beforeEachTest {
                callback = mock()
            }

            fun verifyTransitionToIdleCalled() = verify(callback).onTransitionToIdle()
            fun verifyTransitionToIdleNotCalled() = verify(callback, never()).onTransitionToIdle()

            it("should enqueue an idle-check task") {
                uut.registerIdleTransitionCallback(callback)
                verifyTaskEnqueuedOnce()
            }

            it("should be synchronized over actual executor") {
                val localExecutor = Executors.newSingleThreadExecutor()

                synchronized(sexecutor) {
                    localExecutor.submit {
                        uut.registerIdleTransitionCallback(callback)
                    }
                    yieldToOtherThreads(localExecutor)
                    verifyNoTasksEnqueued()
                }
                yieldToOtherThreads(localExecutor)
            }

            describe("the idle-check task") {
                fun executeIdleCheckTask() {
                    argumentCaptor<Runnable>().also {
                        verify(sexecutorReflected).executeTask(it.capture())
                    }.firstValue.run()
                }

                it("should transition to idle") {
                    givenIdleSExecutor()

                    uut.registerIdleTransitionCallback(callback)
                    executeIdleCheckTask()

                    verifyTransitionToIdleCalled()
                }

                it("should not transition to idle if busy") {
                    givenAnActiveTask()
                    givenPendingTasks()

                    uut.registerIdleTransitionCallback(callback)
                    executeIdleCheckTask()

                    verifyTransitionToIdleNotCalled()
                }

                it("should not inspect sexecutor for activity, because it runs on the executor itself") {
                    givenAnActiveTask()
                    givenPendingTasks()

                    uut.registerIdleTransitionCallback(callback)
                    executeIdleCheckTask()

                    verify(sexecutorReflected, never()).hasActiveTask()
                }

                it("should reenqueue if still busy") {
                    givenAnActiveTask()
                    givenPendingTasks()

                    uut.registerIdleTransitionCallback(callback)
                    executeIdleCheckTask()

                    verifyTaskEnqueuedTwice()
                }

                it("should be synchronized") {
                    val localExecutor = Executors.newSingleThreadExecutor()

                    givenIdleSExecutor()
                    uut.registerIdleTransitionCallback(callback)

                    synchronized(sexecutor) {
                        localExecutor.submit {
                            executeIdleCheckTask()
                        }
                        yieldToOtherThreads(localExecutor)
                        verifyTransitionToIdleNotCalled()
                    }
                    yieldToOtherThreads(localExecutor)
                }

                describe("vs. immediate idle-check") {
                    it("should allow for an enqueuing of more tasks after idle-transition") {
                        uut.registerIdleTransitionCallback(callback)

                        givenIdleSExecutor()
                        executeIdleCheckTask()

                        givenBusySExecutor()
                        uut.isIdleNow

                        verifyTaskEnqueuedTwice()
                    }
                }
            }
        }
    }
})
